const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Servicios
const IMAPService = require('./services/imapService');
const SMTPService = require('./services/smtpService');

const app = express();
const PORT = process.env.PORT || 3001;

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para archivos adjuntos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir todos los tipos de archivo
    cb(null, true);
  }
});

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100,
  duration: 60,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://correopro.daiscom.com',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too Many Requests' });
  }
});

// Inicializar servicios
const imapService = new IMAPService();
const smtpService = new SMTPService();

// Rutas de salud y configuración
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'DaiscomMail Backend is running',
    server: 'correopro.daiscom.com',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/config/test', async (req, res) => {
  try {
    const imapTest = await imapService.connect().then(() => ({ success: true })).catch(err => ({ success: false, error: err.message }));
    const smtpTest = await smtpService.testConnection();
    
    res.json({
      imap: imapTest,
      smtp: smtpTest,
      configured: imapTest.success && smtpTest.success,
      server: 'host-srv-901.daiscom.com.co'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas de carpetas
app.get('/api/folders', async (req, res) => {
  try {
    const folders = await imapService.getFolders();
    res.json(folders);
  } catch (error) {
    console.error('Error obteniendo carpetas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rutas de emails
app.get('/api/emails', async (req, res) => {
  try {
    const { folder = 'INBOX', limit = 50, offset = 0 } = req.query;
    const result = await imapService.getEmails(folder, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo emails:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emails/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { folder = 'INBOX' } = req.query;
    const email = await imapService.getEmailContent(parseInt(uid), folder);
    res.json(email);
  } catch (error) {
    console.error('Error obteniendo email:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/emails/:uid/read', async (req, res) => {
  try {
    const { uid } = req.params;
    const { folder = 'INBOX' } = req.body;
    await imapService.markAsRead(parseInt(uid), folder);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marcando como leído:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/emails/:uid/unread', async (req, res) => {
  try {
    const { uid } = req.params;
    const { folder = 'INBOX' } = req.body;
    await imapService.markAsUnread(parseInt(uid), folder);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marcando como no leído:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/emails/:uid/flag', async (req, res) => {
  try {
    const { uid } = req.params;
    const { folder = 'INBOX' } = req.body;
    await imapService.toggleFlag(parseInt(uid), folder);
    res.json({ success: true });
  } catch (error) {
    console.error('Error cambiando flag:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/emails/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { folder = 'INBOX' } = req.query;
    await imapService.deleteEmail(parseInt(uid), folder);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando email:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/emails/:uid/move', async (req, res) => {
  try {
    const { uid } = req.params;
    const { fromFolder = 'INBOX', toFolder } = req.body;
    await imapService.moveEmail(parseInt(uid), fromFolder, toFolder);
    res.json({ success: true });
  } catch (error) {
    console.error('Error moviendo email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta de búsqueda
app.get('/api/search', async (req, res) => {
  try {
    const { folder = 'INBOX', ...criteria } = req.query;
    const emails = await imapService.searchEmails(criteria, folder);
    res.json({ emails });
  } catch (error) {
    console.error('Error buscando emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta de envío de emails
app.post('/api/emails/send', upload.array('attachments'), async (req, res) => {
  try {
    const emailData = {
      to: req.body.to,
      cc: req.body.cc,
      bcc: req.body.bcc,
      subject: req.body.subject,
      body: req.body.body,
      html: req.body.html,
      plainText: req.body.plainText,
      priority: req.body.priority,
      inReplyTo: req.body.inReplyTo,
      references: req.body.references
    };

    // Procesar archivos adjuntos
    if (req.files && req.files.length > 0) {
      emailData.attachments = req.files.map(file => ({
        name: file.originalname,
        path: file.path,
        type: file.mimetype,
        size: file.size
      }));
    }

    const result = await smtpService.sendEmail(emailData);
    
    // Limpiar archivos temporales
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error eliminando archivo temporal:', err);
        });
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta de estadísticas
app.get('/api/stats', async (req, res) => {
  try {
    const folders = await imapService.getFolders();
    const totalEmails = folders.reduce((sum, folder) => sum + (folder.exists || 0), 0);
    const unreadEmails = folders.reduce((sum, folder) => sum + (folder.unseen || 0), 0);

    res.json({
      totalEmails,
      unreadEmails,
      folders: folders.length,
      server: 'host-srv-901.daiscom.com.co',
      domain: 'correopro.daiscom.com',
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Cerrar conexiones al terminar
process.on('SIGTERM', async () => {
  console.log('Cerrando conexiones...');
  await imapService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Cerrando conexiones...');
  await imapService.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 DaiscomMail Backend server running on port ${PORT}`);
  console.log(`📧 IMAP Host: ${process.env.IMAP_HOST || 'No configurado'}`);
  console.log(`📤 SMTP Host: ${process.env.SMTP_HOST || 'No configurado'}`);
  console.log(`🌐 Domain: correopro.daiscom.com`);
});
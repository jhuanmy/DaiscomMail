# DaiscomMail - Sistema de Correo Electrónico Profesional

DaiscomMail es un sistema completo de correo electrónico que integra Postfix, Dovecot y una interfaz web moderna para proporcionar una solución de correo empresarial robusta y fácil de usar, específicamente diseñado para correopro.daiscom.com.

## Características

### Frontend (Interfaz Web)
- ✅ Interfaz moderna y responsive
- ✅ Gestión completa de correos (leer, enviar, organizar)
- ✅ Búsqueda avanzada con filtros
- ✅ Composer de correos con editor rico
- ✅ Gestión de adjuntos
- ✅ Notificaciones en tiempo real
- ✅ Soporte para múltiples carpetas
- ✅ Filtros anti-spam integrados
- ✅ Diseño específico para Daiscom

### Backend (Servidor)
- 🔧 Integración completa con Postfix/Dovecot
- 🔧 API RESTful para todas las operaciones
- 🔧 Autenticación segura
- 🔧 Gestión de usuarios y dominios
- 🔧 Estadísticas del servidor
- 🔧 Logs y monitoreo
- 🔧 Configuración específica para host-srv-901.daiscom.com.co

### Integración con Sistema Daiscom
- 📧 **Postfix**: Servidor SMTP para envío de correos
- 📬 **Dovecot**: Servidor IMAP/POP3 para recepción
- 🗄️ **MySQL**: Base de datos para usuarios virtuales
- 🛡️ **SpamAssassin**: Filtros anti-spam
- 🦠 **ClamAV**: Antivirus para correos
- 🌐 **Nginx**: Proxy reverso y servidor web
- 🔐 **Let's Encrypt**: Certificados SSL automáticos

## Instalación en VPS Daiscom

### Requisitos del Sistema
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Mínimo 2GB RAM
- 20GB espacio en disco
- Acceso root
- Dominio configurado: correopro.daiscom.com

### Instalación Automática para Daiscom

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/daiscommail.git
cd daiscommail

# Ejecutar instalación completa
sudo bash deploy/setup-daiscom.sh
sudo bash deploy/clone-github.sh
sudo bash deploy/configure-daiscom.sh  
sudo bash deploy/setup-credentials.sh
sudo bash deploy/start-daiscom.sh
```

### Configuración Manual

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/daiscommail.git
cd daiscommail
```

2. **Ejecutar script de instalación**
```bash
cd deploy
chmod +x *.sh
sudo ./setup-daiscom.sh
```

3. **Configurar SSL (automático)**
```bash
sudo certbot --nginx -d correopro.daiscom.com
```

4. **Configurar credenciales**
```bash
sudo ./setup-credentials.sh
```

## Configuración Específica Daiscom

### Estructura de Archivos

```
/home/daiscom/
├── correopro.daiscom.com/
│   ├── public_html/          # Archivos web (frontend)
│   ├── backend/              # Código del backend
│   ├── logs/                 # Logs del dominio
│   ├── config/               # Configuración
│   └── backups/              # Backups
├── logs/                     # Logs generales
└── manage-promail.sh        # Script de gestión
```

### Variables de Entorno

```bash
# Servidor IMAP Daiscom
IMAP_HOST=host-srv-901.daiscom.com.co
IMAP_PORT=143
IMAP_SECURE=false

# Servidor SMTP Daiscom
SMTP_HOST=host-srv-901.daiscom.com.co
SMTP_PORT=25
SMTP_SECURE=false

# Aplicación
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://correopro.daiscom.com
```

## Uso

### Acceso Web
- **Interfaz de usuario**: https://correopro.daiscom.com
- **Panel de administración**: https://correopro.daiscom.com (botón admin)

### Gestión del Servicio

```bash
# Ver estado
sudo -u daiscom ~/manage-promail.sh status

# Ver logs
sudo -u daiscom ~/manage-promail.sh logs

# Reiniciar
sudo -u daiscom ~/manage-promail.sh restart

# Actualizar desde GitHub
sudo -u daiscom ~/manage-promail.sh update

# Crear backup
sudo -u daiscom ~/manage-promail.sh backup
```

### Gestión de Usuarios

```bash
# Crear usuario (simulado en desarrollo)
curl -X POST https://correopro.daiscom.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario","password":"password123","domain":"daiscom.com.co"}'

# Listar usuarios
curl https://correopro.daiscom.com/api/admin/users
```

## Monitoreo y Logs

### Logs del Sistema
```bash
# Logs de Nginx
tail -f /home/daiscom/correopro.daiscom.com/logs/access.log

# Logs de DaiscomMail
tail -f /home/daiscom/correopro.daiscom.com/logs/promail.log

# Logs de PM2
sudo -u daiscom pm2 logs promail-daiscom
```

### Estadísticas
```bash
# Estado de servicios
sudo -u daiscom pm2 status

# Estadísticas via API
curl https://correopro.daiscom.com/api/stats
```

## Actualizaciones desde GitHub

### Configurar repositorio
```bash
cd /home/daiscom/correopro.daiscom.com/
git remote set-url origin https://github.com/tu-usuario/daiscommail.git
```

### Actualización manual
```bash
sudo -u daiscom ~/manage-promail.sh update
```

### Actualización automática
```bash
# Configurar cron para actualizaciones cada 6 horas
sudo -u daiscom crontab -e
# Agregar: 0 */6 * * * /home/daiscom/auto-update.sh
```

## Seguridad

### Configuraciones Implementadas
- 🔐 Autenticación SASL obligatoria
- 🛡️ TLS/SSL para todas las conexiones
- 🚫 Filtros anti-spam con SpamAssassin
- 🦠 Escaneo antivirus con ClamAV
- 🔥 Firewall configurado automáticamente
- 📧 Validación de dominios SPF/DKIM

### Configuración Específica Daiscom
- Servidor IMAP: host-srv-901.daiscom.com.co:143
- Servidor SMTP: host-srv-901.daiscom.com.co:25
- Dominio principal: correopro.daiscom.com
- SSL automático con Let's Encrypt

## Desarrollo

### Entorno local
```bash
# Frontend
npm run dev  # http://localhost:5173

# Backend
cd backend
npm run dev  # http://localhost:3001
```

### Subir cambios
```bash
git add .
git commit -m "Descripción de cambios"
git push origin main

# En el servidor se actualiza automáticamente o manualmente:
sudo -u daiscom ~/manage-promail.sh update
```

## Soporte y Documentación

### Documentación Específica
- [Instalación Daiscom](deploy/README-DAISCOM.md)
- [Configuración VPS](deploy/README-VPS.md)
- [API Reference](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)

### Soporte
- **Issues**: https://github.com/tu-usuario/daiscommail/issues
- **Email**: soporte@daiscom.com.co
- **Documentación**: https://correopro.daiscom.com/docs

## Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## Contribuir

Las contribuciones son bienvenidas. Por favor lee [CONTRIBUTING.md](CONTRIBUTING.md) para más información.

---

**DaiscomMail** - Sistema de correo profesional para correopro.daiscom.com
Desarrollado específicamente para la infraestructura de Daiscom.
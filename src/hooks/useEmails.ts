import { useState, useEffect, useMemo } from 'react';
import { Email, EmailFolder, Contact, SearchQuery } from '../types/email';
import { generateMockContacts } from '../utils/mockData';
import { daiscomAPI } from '../services/api';

export const useEmails = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>('INBOX');
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({ query: '' });
  const [isConnectedToBackend, setIsConnectedToBackend] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  useEffect(() => {
    if (isConnectedToBackend) {
      loadRealData();
    }
  }, [selectedFolder, isConnectedToBackend]);

  const checkBackendConnection = async () => {
    try {
      const health = await daiscomAPI.getHealth();
      const config = await daiscomAPI.testConnection();
      
      if (health.status === 'OK' && config.configured) {
        setIsConnectedToBackend(true);
        setConnectionError(null);
        console.log('✅ Conectado al backend DaiscomMail');
      } else {
        throw new Error('Servidor no configurado correctamente');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo conectar al backend, usando datos simulados');
      setIsConnectedToBackend(false);
      setConnectionError(error instanceof Error ? error.message : 'Error de conexión');
      loadMockData();
    }
  };

  const loadRealData = async () => {
    try {
      setLoading(true);
      
      // Cargar carpetas
      const foldersData = await daiscomAPI.getFolders();
      const processedFolders = foldersData.map((folder: any) => ({
        id: folder.path || folder.id,
        name: folder.name,
        icon: getFolderIcon(folder.name, folder.specialUse),
        count: folder.exists || 0,
        unreadCount: folder.unseen || 0,
        isSystem: isSystemFolder(folder.name, folder.specialUse),
        color: getFolderColor(folder.name, folder.specialUse)
      }));
      setFolders(processedFolders);

      // Cargar emails de la carpeta seleccionada
      const emailsData = await daiscomAPI.getEmails(selectedFolder, 50, 0);
      const processedEmails = emailsData.emails.map((email: any) => ({
        id: email.uid.toString(),
        uid: email.uid,
        from: email.from,
        to: email.to,
        cc: email.cc || [],
        bcc: email.bcc || [],
        subject: email.subject,
        body: '', // Se carga bajo demanda
        date: new Date(email.date),
        isRead: email.isRead,
        isFlagged: email.isFlagged,
        isImportant: email.isImportant,
        labels: [],
        folder: email.folder,
        size: email.size || 0,
        hasAttachments: email.hasAttachments,
        isEncrypted: false,
        priority: 'normal' as const,
        spamScore: 0
      }));
      setEmails(processedEmails);

      // Usar contactos mock por ahora
      setContacts(generateMockContacts());
      
    } catch (error) {
      console.error('Error cargando datos reales:', error);
      setConnectionError(error instanceof Error ? error.message : 'Error cargando datos');
      // Fallback a datos mock
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Importar datos mock como fallback
    import('../utils/mockData').then(({ generateMockEmails, generateMockFolders, generateMockContacts }) => {
      setTimeout(() => {
        setEmails(generateMockEmails());
        setFolders(generateMockFolders());
        setContacts(generateMockContacts());
        setLoading(false);
      }, 1000);
    });
  };

  const filteredEmails = useMemo(() => {
    let filtered = emails;

    // Filter by search query
    if (searchQuery.query) {
      const query = searchQuery.query.toLowerCase();
      filtered = filtered.filter(email => 
        email.subject.toLowerCase().includes(query) ||
        email.from.name.toLowerCase().includes(query) ||
        email.from.email.toLowerCase().includes(query)
      );
    }

    if (searchQuery.from) {
      filtered = filtered.filter(email => 
        email.from.email.toLowerCase().includes(searchQuery.from!.toLowerCase())
      );
    }

    if (searchQuery.to) {
      filtered = filtered.filter(email => 
        email.to.some(recipient => 
          recipient.email.toLowerCase().includes(searchQuery.to!.toLowerCase())
        )
      );
    }

    if (searchQuery.hasAttachment !== undefined) {
      filtered = filtered.filter(email => email.hasAttachments === searchQuery.hasAttachment);
    }

    if (searchQuery.isUnread !== undefined) {
      filtered = filtered.filter(email => !email.isRead === searchQuery.isUnread);
    }

    if (searchQuery.isFlagged !== undefined) {
      filtered = filtered.filter(email => email.isFlagged === searchQuery.isFlagged);
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [emails, searchQuery]);

  const markAsRead = async (emailId: string) => {
    if (isConnectedToBackend) {
      try {
        await daiscomAPI.markAsRead(emailId, selectedFolder);
      } catch (error) {
        console.error('Error marcando como leído:', error);
      }
    }
    
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isRead: true } : email
    ));
  };

  const markAsUnread = async (emailId: string) => {
    if (isConnectedToBackend) {
      try {
        await daiscomAPI.markAsUnread(emailId, selectedFolder);
      } catch (error) {
        console.error('Error marcando como no leído:', error);
      }
    }
    
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isRead: false } : email
    ));
  };

  const toggleFlag = async (emailId: string) => {
    if (isConnectedToBackend) {
      try {
        await daiscomAPI.toggleFlag(emailId, selectedFolder);
      } catch (error) {
        console.error('Error cambiando flag:', error);
      }
    }
    
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isFlagged: !email.isFlagged } : email
    ));
  };

  const toggleImportant = (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isImportant: !email.isImportant } : email
    ));
  };

  const deleteEmail = async (emailId: string) => {
    if (isConnectedToBackend) {
      try {
        await daiscomAPI.deleteEmail(emailId, selectedFolder);
      } catch (error) {
        console.error('Error eliminando email:', error);
        return;
      }
    }
    
    setEmails(prev => prev.filter(email => email.id !== emailId));
  };

  const moveToFolder = async (emailId: string, folderId: string) => {
    if (isConnectedToBackend) {
      try {
        await daiscomAPI.moveEmail(emailId, selectedFolder, folderId);
      } catch (error) {
        console.error('Error moviendo email:', error);
        return;
      }
    }
    
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, folder } : email
      ));
    }
  };

  const sendEmail = async (emailData: Partial<Email>) => {
    try {
      if (isConnectedToBackend) {
        const result = await daiscomAPI.sendEmail({
          to: emailData.to?.map(t => t.email).join(','),
          cc: emailData.cc?.map(c => c.email).join(','),
          bcc: emailData.bcc?.map(b => b.email).join(','),
          subject: emailData.subject,
          html: emailData.body,
          priority: emailData.priority
        });
        
        console.log('✅ Email enviado:', result.messageId);
      }

      // Agregar a la lista local (para feedback inmediato)
      const newEmail: Email = {
        id: Date.now().toString(),
        uid: Date.now(),
        from: {
          name: 'Usuario Actual',
          email: 'usuario@daiscom.com.co'
        },
        to: emailData.to || [],
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject || '',
        body: emailData.body || '',
        date: new Date(),
        isRead: true,
        isFlagged: false,
        isImportant: false,
        labels: [],
        folder: folders.find(f => f.name === 'Enviados') || folders[0],
        size: emailData.body?.length || 0,
        hasAttachments: emailData.attachments ? emailData.attachments.length > 0 : false,
        isEncrypted: false,
        priority: emailData.priority || 'normal',
        attachments: emailData.attachments || []
      };

      setEmails(prev => [newEmail, ...prev]);
      return newEmail;
    } catch (error) {
      console.error('Error enviando email:', error);
      throw error;
    }
  };

  const getEmailContent = async (emailId: string) => {
    if (isConnectedToBackend) {
      try {
        return await daiscomAPI.getEmail(emailId, selectedFolder);
      } catch (error) {
        console.error('Error obteniendo contenido del email:', error);
      }
    }
    
    // Fallback: buscar en emails locales
    return emails.find(email => email.id === emailId);
  };

  // Funciones auxiliares
  const getFolderIcon = (name: string, specialUse?: string) => {
    if (specialUse) {
      switch (specialUse) {
        case '\\Inbox': return 'Inbox';
        case '\\Sent': return 'Send';
        case '\\Drafts': return 'FileText';
        case '\\Trash': return 'Trash2';
        case '\\Junk': return 'AlertTriangle';
        default: return 'Folder';
      }
    }
    
    switch (name.toLowerCase()) {
      case 'inbox':
      case 'bandeja de entrada': return 'Inbox';
      case 'sent':
      case 'enviados': return 'Send';
      case 'drafts':
      case 'borradores': return 'FileText';
      case 'trash':
      case 'papelera': return 'Trash2';
      case 'spam':
      case 'junk': return 'AlertTriangle';
      default: return 'Folder';
    }
  };

  const getFolderColor = (name: string, specialUse?: string) => {
    if (name.toLowerCase().includes('spam') || name.toLowerCase().includes('junk')) {
      return 'text-orange-600';
    }
    if (name.toLowerCase().includes('trash') || name.toLowerCase().includes('papelera')) {
      return 'text-red-600';
    }
    return undefined;
  };

  const isSystemFolder = (name: string, specialUse?: string) => {
    return !!specialUse || ['inbox', 'sent', 'drafts', 'trash', 'spam', 'junk'].includes(name.toLowerCase());
  };

  return {
    emails: filteredEmails,
    folders,
    contacts,
    loading,
    selectedFolder,
    setSelectedFolder,
    searchQuery,
    setSearchQuery,
    markAsRead,
    markAsUnread,
    toggleFlag,
    toggleImportant,
    deleteEmail,
    moveToFolder,
    sendEmail,
    getEmailContent,
    isConnectedToBackend,
    connectionError,
    refreshData: isConnectedToBackend ? loadRealData : loadMockData
  };
};
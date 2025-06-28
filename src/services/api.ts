// Servicio para conectar el frontend con el backend de DaiscomMail

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

class DaiscomAPI {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('daiscommail_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error en ${endpoint}:`, error);
      throw error;
    }
  }

  // Verificar configuración del servidor
  async testConnection() {
    return this.request('/config/test');
  }

  // Gestión de carpetas
  async getFolders() {
    return this.request('/folders');
  }

  // Gestión de correos
  async getEmails(folder = 'INBOX', limit = 50, offset = 0) {
    return this.request(`/emails?folder=${encodeURIComponent(folder)}&limit=${limit}&offset=${offset}`);
  }

  async getEmail(uid: string, folder = 'INBOX') {
    return this.request(`/emails/${uid}?folder=${encodeURIComponent(folder)}`);
  }

  async sendEmail(emailData: any, attachments?: File[]) {
    const formData = new FormData();
    
    // Agregar datos del email
    Object.keys(emailData).forEach(key => {
      if (emailData[key] !== undefined && emailData[key] !== null) {
        if (Array.isArray(emailData[key])) {
          formData.append(key, JSON.stringify(emailData[key]));
        } else {
          formData.append(key, emailData[key]);
        }
      }
    });

    // Agregar archivos adjuntos
    if (attachments && attachments.length > 0) {
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    return fetch(`${API_BASE_URL}/emails/send`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`);
      }
      return response.json();
    });
  }

  async markAsRead(uid: string, folder = 'INBOX') {
    return this.request(`/emails/${uid}/read`, {
      method: 'PUT',
      body: JSON.stringify({ folder }),
    });
  }

  async markAsUnread(uid: string, folder = 'INBOX') {
    return this.request(`/emails/${uid}/unread`, {
      method: 'PUT',
      body: JSON.stringify({ folder }),
    });
  }

  async toggleFlag(uid: string, folder = 'INBOX') {
    return this.request(`/emails/${uid}/flag`, {
      method: 'PUT',
      body: JSON.stringify({ folder }),
    });
  }

  async deleteEmail(uid: string, folder = 'INBOX') {
    return this.request(`/emails/${uid}?folder=${encodeURIComponent(folder)}`, {
      method: 'DELETE',
    });
  }

  async moveEmail(uid: string, fromFolder: string, toFolder: string) {
    return this.request(`/emails/${uid}/move`, {
      method: 'PUT',
      body: JSON.stringify({ fromFolder, toFolder }),
    });
  }

  // Búsqueda
  async searchEmails(criteria: any, folder = 'INBOX') {
    const params = new URLSearchParams({ folder, ...criteria }).toString();
    return this.request(`/search?${params}`);
  }

  // Estadísticas del servidor
  async getServerStats() {
    return this.request('/stats');
  }

  // Verificar estado de salud
  async getHealth() {
    return this.request('/health');
  }
}

export const daiscomAPI = new DaiscomAPI();
export default daiscomAPI;
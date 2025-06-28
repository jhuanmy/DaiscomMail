import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Globe, 
  Server, 
  Shield, 
  Activity, 
  Settings,
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  Database,
  Mail,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { daiscomAPI } from '../services/api';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverStats, setServerStats] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadServerData();
    }
  }, [isOpen]);

  const loadServerData = async () => {
    setLoading(true);
    try {
      // Verificar conexión
      const config = await daiscomAPI.testConnection();
      setConnectionStatus(config);

      if (config.configured) {
        // Cargar estadísticas reales
        const stats = await daiscomAPI.getServerStats();
        setServerStats(stats);
      } else {
        // Usar datos simulados
        setServerStats({
          totalEmails: 156,
          unreadEmails: 23,
          folders: 12,
          lastUpdate: new Date().toISOString()
        });
      }

      // Datos simulados para usuarios y dominios
      setUsers([
        { email: 'admin@daiscom.com.co', domain: 'daiscom.com.co', lastLogin: '2024-01-15 10:30' },
        { email: 'soporte@daiscom.com.co', domain: 'daiscom.com.co', lastLogin: '2024-01-15 09:15' },
        { email: 'ventas@daiscom.com.co', domain: 'daiscom.com.co', lastLogin: '2024-01-14 16:45' }
      ]);

      setDomains([
        { name: 'daiscom.com.co', userCount: 25, aliasCount: 12 },
        { name: 'correopro.daiscom.com', userCount: 5, aliasCount: 3 }
      ]);

    } catch (error) {
      console.error('Error cargando datos del servidor:', error);
      // Fallback a datos simulados
      setServerStats({
        totalEmails: 0,
        unreadEmails: 0,
        folders: 0,
        lastUpdate: new Date().toISOString()
      });
      setConnectionStatus({ configured: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: any) => {
    try {
      setLoading(true);
      // Simular creación de usuario
      setTimeout(() => {
        setUsers(prev => [...prev, {
          email: `${userData.username}@${userData.domain}`,
          domain: userData.domain,
          lastLogin: 'Nunca'
        }]);
        setLoading(false);
        alert('Usuario creado exitosamente (simulado)');
      }, 1000);
    } catch (error) {
      alert('Error creando usuario');
      setLoading(false);
    }
  };

  const addDomain = async (domain: string) => {
    try {
      setLoading(true);
      // Simular agregado de dominio
      setTimeout(() => {
        setDomains(prev => [...prev, {
          name: domain,
          userCount: 0,
          aliasCount: 0
        }]);
        setLoading(false);
        alert('Dominio agregado exitosamente (simulado)');
      }, 1000);
    } catch (error) {
      alert('Error agregando dominio');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <motion.div
        className="bg-white w-full max-w-6xl mx-auto my-4 rounded-lg shadow-xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Panel de Administración DaiscomMail</h1>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-blue-100 text-sm">
                  Servidor: correopro.daiscom.com
                </p>
                {connectionStatus && (
                  <div className={`flex items-center space-x-1 text-sm ${
                    connectionStatus.configured ? 'text-green-200' : 'text-yellow-200'
                  }`}>
                    {connectionStatus.configured ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Conectado</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} />
                        <span>Configuración pendiente</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadServerData}
                disabled={loading}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[80vh]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Activity },
                { id: 'users', label: 'Usuarios', icon: Users },
                { id: 'domains', label: 'Dominios', icon: Globe },
                { id: 'server', label: 'Servidor', icon: Server },
                { id: 'security', label: 'Seguridad', icon: Shield },
                { id: 'settings', label: 'Configuración', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Estado del Sistema DaiscomMail</h2>
                
                {/* Connection Status */}
                <div className="mb-6 p-4 rounded-lg border-l-4 border-blue-600 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Estado de Conexión</h3>
                      <p className="text-sm text-gray-600">
                        IMAP: host-srv-901.daiscom.com.co:143 | SMTP: host-srv-901.daiscom.com.co:25
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      connectionStatus?.configured 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {connectionStatus?.configured ? 'Conectado' : 'Pendiente configuración'}
                    </div>
                  </div>
                </div>
                
                {serverStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Emails</p>
                          <p className="text-3xl font-bold text-blue-600">{serverStats.totalEmails}</p>
                        </div>
                        <Mail className="w-12 h-12 text-blue-600 opacity-20" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Sin Leer</p>
                          <p className="text-3xl font-bold text-blue-600">{serverStats.unreadEmails}</p>
                        </div>
                        <Eye className="w-12 h-12 text-blue-600 opacity-20" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Carpetas</p>
                          <p className="text-3xl font-bold text-blue-600">{serverStats.folders}</p>
                        </div>
                        <Globe className="w-12 h-12 text-blue-600 opacity-20" />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Estado</p>
                          <p className="text-lg font-semibold text-green-600">
                            {connectionStatus?.configured ? 'Activo' : 'Configurando'}
                          </p>
                        </div>
                        <Database className="w-12 h-12 text-green-500 opacity-20" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-4">Configuración del Servidor</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'IMAP Server', status: connectionStatus?.imap?.success, details: 'host-srv-901.daiscom.com.co:143' },
                        { name: 'SMTP Server', status: connectionStatus?.smtp?.success, details: 'host-srv-901.daiscom.com.co:25' },
                        { name: 'TLS/SSL', status: false, details: 'Puerto 143/25 (no seguro)' },
                        { name: 'Autenticación', status: connectionStatus?.configured, details: 'Usuario/Contraseña' }
                      ].map((service) => (
                        <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.details}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {service.status ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            )}
                            <span className={`text-sm ${service.status ? 'text-green-600' : 'text-yellow-600'}`}>
                              {service.status ? 'OK' : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-4">Configuración Requerida</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Credenciales de Email</h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          Para conectar con el servidor Daiscom, necesitas configurar:
                        </p>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Usuario de email (IMAP_USER)</li>
                          <li>• Contraseña de email (IMAP_PASSWORD)</li>
                          <li>• Usuario SMTP (SMTP_USER)</li>
                          <li>• Contraseña SMTP (SMTP_PASSWORD)</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Archivo .env</h4>
                        <p className="text-sm text-blue-700">
                          Edita el archivo <code>backend/.env</code> con tus credenciales reales de Daiscom.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
                  <button
                    onClick={() => {
                      const username = prompt('Nombre de usuario:');
                      const password = prompt('Contraseña:');
                      const domain = prompt('Dominio:', 'daiscom.com.co');
                      if (username && password && domain) {
                        createUser({ username, password, domain });
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Agregar Usuario</span>
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dominio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último acceso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.domain}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Activo
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLogin || 'Nunca'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-700 mr-3">
                              <Edit size={16} />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'server' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Configuración del Servidor</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600" />
                    <p className="text-blue-800 font-medium">
                      Configuración del Servidor Daiscom
                    </p>
                  </div>
                  <p className="text-blue-700 text-sm mt-2">
                    Servidor configurado: host-srv-901.daiscom.com.co (IMAP: 143, SMTP: 25)
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-4">Configuración IMAP</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Servidor:</span>
                        <span className="font-mono text-sm">host-srv-901.daiscom.com.co</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Puerto:</span>
                        <span className="font-mono text-sm">143</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seguridad:</span>
                        <span className="text-yellow-600">No SSL/TLS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estado:</span>
                        <span className={connectionStatus?.imap?.success ? 'text-green-600' : 'text-red-600'}>
                          {connectionStatus?.imap?.success ? 'Conectado' : 'Desconectado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-4">Configuración SMTP</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Servidor:</span>
                        <span className="font-mono text-sm">host-srv-901.daiscom.com.co</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Puerto:</span>
                        <span className="font-mono text-sm">25</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seguridad:</span>
                        <span className="text-yellow-600">No SSL/TLS</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estado:</span>
                        <span className={connectionStatus?.smtp?.success ? 'text-green-600' : 'text-red-600'}>
                          {connectionStatus?.smtp?.success ? 'Conectado' : 'Desconectado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Otros tabs similares pero adaptados para Daiscom */}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
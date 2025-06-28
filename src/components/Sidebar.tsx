import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { EmailFolder } from '../types/email';

interface SidebarProps {
  folders: EmailFolder[];
  selectedFolder: string;
  onFolderSelect: (folderId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCompose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  selectedFolder,
  onFolderSelect,
  isCollapsed,
  onToggleCollapse,
  onCompose
}) => {
  const getIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] as any;
    return Icon ? <Icon size={20} /> : <Icons.Folder size={20} />;
  };

  return (
    <motion.div
      className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Icons.Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-gray-900">DaiscomMail</h1>
                <span className="text-xs text-blue-600">correopro.daiscom.com</span>
              </div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icons.Menu size={20} />
          </button>
        </div>
      </div>

      {/* Compose Button */}
      <div className="p-4 flex-shrink-0">
        <motion.button
          onClick={onCompose}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 ${
            isCollapsed ? 'p-3' : 'p-3'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Icons.Plus size={20} />
          {!isCollapsed && <span className="font-medium">Redactar</span>}
        </motion.button>
      </div>

      {/* Folders - Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto px-2 py-2">
          {folders.map((folder) => (
            <motion.button
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 ${
                selectedFolder === folder.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              whileHover={{ x: isCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`${folder.color || 'text-gray-500'}`}>
                {getIcon(folder.icon)}
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left font-medium">{folder.name}</span>
                  {folder.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                      {folder.unreadCount > 99 ? '99+' : folder.unreadCount}
                    </span>
                  )}
                </>
              )}
            </motion.button>
          ))}
          
          {/* Spacer para mejor scroll */}
          <div className="h-4"></div>
        </div>
      </div>

      {/* Storage Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="text-sm text-gray-600 mb-2">Almacenamiento</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }}></div>
          </div>
          <div className="text-xs text-gray-500">6.8 GB de 10 GB utilizados</div>
        </div>
      )}
    </motion.div>
  );
};
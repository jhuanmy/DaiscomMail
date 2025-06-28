import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Settings, User, Menu, Server, Shield } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { EmailList } from './components/EmailList';
import { EmailViewer } from './components/EmailViewer';
import { EmailComposer } from './components/EmailComposer';
import { NotificationPanel } from './components/NotificationPanel';
import { AdminPanel } from './components/AdminPanel';
import { ServerStatus } from './components/ServerStatus';
import { ResizablePanel } from './components/ResizablePanel';
import { useEmails } from './hooks/useEmails';

function App() {
  const {
    emails,
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
    sendEmail
  } = useEmails();

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isServerStatusOpen, setIsServerStatusOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<'compose' | 'reply' | 'forward'>('compose');
  const [replyToEmail, setReplyToEmail] = useState<any>(null);

  const selectedEmailData = emails.find(email => email.id === selectedEmail);
  const unreadCount = emails.filter(email => !email.isRead).length;

  const handleReply = (email: any) => {
    setReplyToEmail(email);
    setComposerMode('reply');
    setIsComposerOpen(true);
  };

  const handleReplyAll = (email: any) => {
    setReplyToEmail(email);
    setComposerMode('reply');
    setIsComposerOpen(true);
  };

  const handleForward = (email: any) => {
    setReplyToEmail(email);
    setComposerMode('forward');
    setIsComposerOpen(true);
  };

  const handleCompose = () => {
    setReplyToEmail(null);
    setComposerMode('compose');
    setIsComposerOpen(true);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden lg:flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DM</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">DaiscomMail</h1>
              <span className="text-xs text-blue-600 font-medium">
                correopro.daiscom.com
              </span>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Postfix/Dovecot
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCompose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span className="hidden sm:inline">Redactar</span>
            <span className="sm:hidden">+</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          <button 
            onClick={() => setIsServerStatusOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Estado del servidor"
          >
            <Server size={20} />
          </button>

          <button 
            onClick={() => setIsAdminPanelOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Panel de administración"
          >
            <Shield size={20} />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings size={20} />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <User size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
          <Sidebar
            folders={folders}
            selectedFolder={selectedFolder}
            onFolderSelect={setSelectedFolder}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onCompose={handleCompose}
          />
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Content Area with Resizable Panels */}
          <div className="flex-1 overflow-hidden">
            {/* Desktop: Resizable panels */}
            <div className="hidden lg:block h-full">
              <ResizablePanel
                leftPanel={
                  <EmailList
                    emails={emails}
                    loading={loading}
                    selectedEmail={selectedEmail}
                    onEmailSelect={setSelectedEmail}
                    onMarkAsRead={markAsRead}
                    onMarkAsUnread={markAsUnread}
                    onToggleFlag={toggleFlag}
                    onToggleImportant={toggleImportant}
                    onDelete={deleteEmail}
                  />
                }
                rightPanel={
                  <EmailViewer
                    email={selectedEmailData || null}
                    onReply={handleReply}
                    onReplyAll={handleReplyAll}
                    onForward={handleForward}
                    onToggleFlag={toggleFlag}
                    onToggleImportant={toggleImportant}
                    onDelete={deleteEmail}
                    onArchive={(emailId) => console.log('Archive', emailId)}
                  />
                }
                defaultLeftWidth={384}
                minLeftWidth={280}
                maxLeftWidth={600}
              />
            </div>

            {/* Mobile: Stack layout */}
            <div className="lg:hidden h-full flex">
              {/* Email List */}
              <div className={`${selectedEmail ? 'hidden' : 'block'} w-full`}>
                <EmailList
                  emails={emails}
                  loading={loading}
                  selectedEmail={selectedEmail}
                  onEmailSelect={setSelectedEmail}
                  onMarkAsRead={markAsRead}
                  onMarkAsUnread={markAsUnread}
                  onToggleFlag={toggleFlag}
                  onToggleImportant={toggleImportant}
                  onDelete={deleteEmail}
                />
              </div>

              {/* Email Viewer */}
              <div className={`${selectedEmail ? 'block' : 'hidden'} w-full`}>
                <EmailViewer
                  email={selectedEmailData || null}
                  onReply={handleReply}
                  onReplyAll={handleReplyAll}
                  onForward={handleForward}
                  onToggleFlag={toggleFlag}
                  onToggleImportant={toggleImportant}
                  onDelete={deleteEmail}
                  onArchive={(emailId) => console.log('Archive', emailId)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to List Button (Mobile) */}
      {selectedEmail && (
        <div className="lg:hidden fixed bottom-4 left-4 z-30">
          <motion.button
            onClick={() => setSelectedEmail(null)}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ←
          </motion.button>
        </div>
      )}

      {/* Email Composer */}
      <EmailComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSend={sendEmail}
        contacts={contacts}
        replyTo={replyToEmail}
        mode={composerMode}
      />

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />

      {/* Server Status */}
      <ServerStatus
        isOpen={isServerStatusOpen}
        onClose={() => setIsServerStatusOpen(false)}
      />
    </div>
  );
}

export default App;
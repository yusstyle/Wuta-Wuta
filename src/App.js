import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Sparkles, 
  Gallery as GalleryIcon, 
  Settings,
  User,
  Zap,
  Wallet
} from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CreateArt from './components/CreateArt';
import Gallery from './components/Gallery';
import UserProfile from './components/UserProfile';
import Dashboard from './components/Dashboard';
import { useMuseStore } from './store/museStore';
import { useWalletStore } from './store/walletStore';
import './App.css';

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { initializeMuse, isConnected } = useMuseStore();
  const { connectWallet, disconnectWallet, address } = useWalletStore();

  useEffect(() => {
    // Initialize Muse connection
    initializeMuse();
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [initializeMuse]);

  const navigation = [
    { id: 'create', name: 'Create Art', icon: Palette },
    { id: 'gallery', name: 'Gallery', icon: GalleryIcon },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'dashboard', name: 'Dashboard', icon: Zap },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <CreateArt />;
      case 'gallery':
        return <Gallery />;
      case 'profile':
        return <UserProfile />;
      case 'dashboard':
        return <Dashboard />;
      case 'settings':
        return <div>Settings</div>;
      default:
        return <CreateArt />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-x-hidden">
        <Toaster position="top-right" />
        
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onConnectWallet={connectWallet}
          onDisconnectWallet={disconnectWallet}
          address={address}
          isConnected={isConnected}
        />

        <div className="flex pt-16">
          <Sidebar 
            navigation={navigation}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (isMobile) {
                setSidebarOpen(false);
              }
            }}
            isOpen={sidebarOpen}
          />

          <main className={`flex-1 transition-all duration-300 w-full ${sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-4 sm:p-6 lg:p-8 w-full max-w-[100vw]"
            >
              {renderContent()}
            </motion.div>
          </main>
          
          {/* Overlay for mobile sidebar */}
          {isMobile && sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default App;

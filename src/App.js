import React from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import TransactionHistory from './components/TransactionHistory';
import ArtMintingStepper from './components/ArtMintingStepper';
import NotFound from './components/NotFound';

// Context
import { ThemeProvider } from './contexts/ThemeContext';

// Styles
import './index.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [walletConnected, setWalletConnected] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState('');

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleConnectWallet = async () => {
    // Wallet connection logic here
    setWalletConnected(true);
    setWalletAddress('0x1234...5678'); // Example address
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
  };

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Header
              onMenuClick={handleMenuClick}
              onConnectWallet={handleConnectWallet}
              onDisconnectWallet={handleDisconnectWallet}
              address={walletAddress}
              isConnected={walletConnected}
            />

            <div className="pt-16 sm:pt-20">
              <div className="flex">
                {/* Sidebar - Desktop */}
                <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-20">
                  <Sidebar
                    isOpen={true}
                    onClose={() => {}}
                    walletConnected={walletConnected}
                    walletAddress={walletAddress}
                  />
                </aside>

                {/* Mobile Sidebar */}
                {sidebarOpen && (
                  <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={handleMenuClick} />
                    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl">
                      <div className="pt-16 sm:pt-20">
                        <Sidebar
                          isOpen={sidebarOpen}
                          onClose={handleMenuClick}
                          walletConnected={walletConnected}
                          walletAddress={walletAddress}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Content */}
                <main className="flex-1 md:ml-64">
                  <div className="px-4 py-6 sm:px-6 lg:px-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/profile" element={<UserProfile />} />
                        <Route path="/transactions" element={<TransactionHistory />} />
                        <Route path="/create" element={<ArtMintingStepper />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </motion.div>
                  </div>
                </main>
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav
              walletConnected={walletConnected}
              onConnectWallet={handleConnectWallet}
              onDisconnectWallet={handleDisconnectWallet}
              walletAddress={walletAddress}
            />

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid var(--toast-border)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
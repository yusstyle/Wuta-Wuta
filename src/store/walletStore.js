import { create } from 'zustand';
import { ethers } from 'ethers';

const useWalletStore = create((set, get) => ({
  // State
  isConnecting: false,
  isConnected: false,
  address: null,
  provider: null,
  signer: null,
  balance: null,
  chainId: null,
  error: null,

  // Actions
  connectWallet: async () => {
    try {
      set({ isConnecting: true, error: null });

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const network = await provider.getNetwork();

      set({
        isConnecting: false,
        isConnected: true,
        address,
        provider,
        signer,
        balance,
        chainId: Number(network.chainId),
        error: null,
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          get().disconnectWallet();
        } else {
          get().updateAccount(accounts[0]);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ 
        isConnecting: false, 
        error: error.message 
      });
    }
  },

  disconnectWallet: () => {
    set({
      isConnecting: false,
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      balance: null,
      chainId: null,
      error: null,
    });
  },

  updateAccount: async (newAddress) => {
    try {
      const { provider } = get();
      if (!provider) return;

      const signer = await provider.getSigner();
      const balance = await provider.getBalance(newAddress);

      set({
        address: newAddress,
        signer,
        balance,
      });
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  },

  sendTransaction: async (to, value) => {
    try {
      const { signer } = get();
      if (!signer) throw new Error('Wallet not connected');

      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
      });

      return tx;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  },

  switchNetwork: async (chainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  },

  addNetwork: async (networkConfig) => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });
    } catch (error) {
      console.error('Failed to add network:', error);
      throw error;
    }
  },

  signMessage: async (message) => {
    try {
      const { signer } = get();
      if (!signer) throw new Error('Wallet not connected');

      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export { useWalletStore };

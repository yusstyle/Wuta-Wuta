import { create } from 'zustand';
import { ethers } from 'ethers';
import { Drips } from '@dripsprotocol/sdk';

const useDripsStore = create((set, get) => ({
  // State
  isConnected: false,
  isLoading: false,
  error: null,
  provider: null,
  dripsClient: null,
  stats: {
    totalFunding: 0,
    activeContributors: 0,
    projectsFunded: 0,
    transactionVolume: 0,
  },
  recentActivity: [],
  topProjects: [],
  fundingHistory: [],
  contributorMetrics: [],

  // Actions
  initializeDrips: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Initialize provider
      const provider = new ethers.JsonRpcProvider(
        process.env.REACT_APP_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID'
      );
      
      // Initialize Drips client
      const dripsClient = new Drips(provider);
      
      set({ 
        provider, 
        dripsClient, 
        isConnected: true, 
        isLoading: false 
      });
      
      // Load initial data
      await get().loadDashboardData();
      
    } catch (error) {
      console.error('Failed to initialize Drips:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  loadDashboardData: async () => {
    try {
      set({ isLoading: true });
      
      // Mock data for demonstration - in production, fetch from Drips contracts
      const mockStats = {
        totalFunding: 28450,
        activeContributors: 1234,
        projectsFunded: 89,
        transactionVolume: 45678,
      };

      const mockActivity = [
        { id: 1, type: 'funding', amount: '0.5 ETH', project: 'Project Alpha', timestamp: new Date() },
        { id: 2, type: 'distribution', amount: '0.1 ETH', project: 'Project Beta', timestamp: new Date() },
        { id: 3, type: 'funding', amount: '1.2 ETH', project: 'Project Gamma', timestamp: new Date() },
      ];

      const mockProjects = [
        { id: 1, name: 'DeFi Protocol', funding: 12500, contributors: 45, growth: 23 },
        { id: 2, name: 'NFT Marketplace', funding: 8200, contributors: 32, growth: 15 },
        { id: 3, name: 'DAO Tools', funding: 6800, contributors: 28, growth: 8 },
      ];

      const mockFundingHistory = [
        { month: 'Jan', amount: 4000, projects: 12 },
        { month: 'Feb', amount: 3000, projects: 15 },
        { month: 'Mar', amount: 5000, projects: 18 },
        { month: 'Apr', amount: 2780, projects: 22 },
        { month: 'May', amount: 6890, projects: 25 },
        { month: 'Jun', amount: 7390, projects: 30 },
      ];

      const mockContributorMetrics = [
        { type: 'New Contributors', value: 400, color: '#8b5cf6' },
        { type: 'Active Contributors', value: 300, color: '#3b82f6' },
        { type: 'Top Contributors', value: 200, color: '#10b981' },
        { type: 'Inactive Contributors', value: 100, color: '#6b7280' },
      ];

      set({
        stats: mockStats,
        recentActivity: mockActivity,
        topProjects: mockProjects,
        fundingHistory: mockFundingHistory,
        contributorMetrics: mockContributorMetrics,
        isLoading: false,
      });
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  getProjectFunding: async (projectId) => {
    try {
      const { dripsClient } = get();
      if (!dripsClient) throw new Error('Drips client not initialized');
      
      // In production, fetch actual project funding data
      const mockFunding = {
        totalFunding: ethers.parseEther('5.5'),
        monthlyFunding: ethers.parseEther('0.5'),
        contributors: 12,
        lastDistribution: Date.now() - 86400000, // 1 day ago
      };
      
      return mockFunding;
    } catch (error) {
      console.error('Failed to get project funding:', error);
      throw error;
    }
  },

  getContributorStats: async (address) => {
    try {
      const { dripsClient } = get();
      if (!dripsClient) throw new Error('Drips client not initialized');
      
      // In production, fetch actual contributor stats
      const mockStats = {
        totalReceived: ethers.parseEther('2.5'),
        projectsContributed: 5,
        reputationScore: 85,
        joinDate: Date.now() - 7776000000, // 90 days ago
      };
      
      return mockStats;
    } catch (error) {
      console.error('Failed to get contributor stats:', error);
      throw error;
    }
  },

  subscribeToProject: async (projectId, amountPerSecond) => {
    try {
      const { dripsClient } = get();
      if (!dripsClient) throw new Error('Drips client not initialized');
      
      // In production, call actual Drips contract
      console.log(`Subscribing to project ${projectId} with ${amountPerSecond} wei/second`);
      
      return true;
    } catch (error) {
      console.error('Failed to subscribe to project:', error);
      throw error;
    }
  },

  unsubscribeFromProject: async (projectId) => {
    try {
      const { dripsClient } = get();
      if (!dripsClient) throw new Error('Drips client not initialized');
      
      // In production, call actual Drips contract
      console.log(`Unsubscribing from project ${projectId}`);
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from project:', error);
      throw error;
    }
  },

  refreshData: async () => {
    await get().loadDashboardData();
  },

  clearError: () => set({ error: null }),
}));

export { useDripsStore };

import { create } from 'zustand';
import { SorobanRpc } from '@sorobanrpc';
import { Keypair, Horizon } from '@stellar/stellar-sdk';
import visionService from '../ai/visionService';

const useMuseStore = create((set, get) => ({
  // State
  isConnected: false,
  isLoading: false,
  error: null,
  isAnalyzing: false,
  
  // Stellar connection
  stellarClient: null,
  horizonServer: null,
  network: 'Test SDF Future Network ; October 2022',
  rpcUrl: 'https://rpc-futurenet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  
  // Contract addresses
  contracts: {
    artAssetToken: null,
    nftMarketplace: null,
  },
  
  // User data
  userAddress: null,
  userKeypair: null,
  
  // Artwork data
  artworks: [],
  listings: [],
  offers: [],
  
  // AI Models
  aiModels: [
    { id: 'stable-diffusion', name: 'Stable Diffusion', type: 'image' },
    { id: 'dall-e-3', name: 'DALL-E 3', type: 'image' },
    { id: 'gpt-4', name: 'GPT-4', type: 'text' },
    { id: 'midjourney', name: 'Midjourney', type: 'image' },
  ],
  
  // Actions
  initializeMuse: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Initialize Stellar RPC client
      const stellarClient = new SorobanRpc(get().rpcUrl);
      
      // Initialize Horizon server
      const horizonServer = new Horizon.Server(get().horizonUrl);
      
      // Set contract addresses (these would be deployed contracts)
      const contracts = {
        artAssetToken: process.env.REACT_APP_ART_ASSET_TOKEN_CONTRACT || 'art_asset_token',
        nftMarketplace: process.env.REACT_APP_NFT_MARKETPLACE_CONTRACT || 'nft_marketplace',
      };
      
      set({ 
        stellarClient,
        horizonServer,
        contracts,
        isConnected: true,
        isLoading: false 
      });
      
      // Load initial data
      get().loadMarketplaceData();
      
    } catch (error) {
      console.error('Failed to initialize Muse:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },
  
  connectStellarWallet: async (secretKey) => {
    try {
      set({ isLoading: true, error: null });
      
      const keypair = Keypair.fromSecret(secretKey);
      const userAddress = keypair.publicKey();
      
      set({
        userAddress,
        userKeypair: keypair,
        isLoading: false,
      });
      
      // Load user's artworks
      get().loadUserArtworks(userAddress);
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },
  
  disconnectWallet: () => {
    set({
      userAddress: null,
      userKeypair: null,
      artworks: [],
    });
  },
  
  // Artwork creation
  createCollaborativeArtwork: async (params) => {
    try {
      set({ isLoading: true, error: null });
      
      const { stellarClient, contracts, userAddress } = get();
      if (!stellarClient || !userAddress) throw new Error('Not connected to Stellar');
      
      // Generate AI artwork first
      const aiGeneratedImage = await get().generateArtwork(params);
      
      // Analyze artwork with Vision AI
      set({ isAnalyzing: true });
      let visionAnalysis = null;
      
      try {
        visionAnalysis = await visionService.analyzeArtwork(aiGeneratedImage, params.prompt);
      } catch (visionError) {
        console.warn('Vision analysis failed, continuing without it:', visionError);
        // Continue without vision analysis
      } finally {
        set({ isAnalyzing: false });
      }
      
      // Create artwork metadata with vision analysis
      const metadata = {
        prompt: params.prompt,
        aiModel: params.aiModel,
        humanContribution: params.humanContribution,
        aiContribution: params.aiContribution,
        canEvolve: params.canEvolve,
        timestamp: Date.now(),
        // Add vision analysis results
        aiDescription: visionAnalysis?.description || '',
        aiTags: visionAnalysis?.tags || [],
        aiStyle: visionAnalysis?.style || 'unknown',
        aiMood: visionAnalysis?.mood || 'neutral',
        aiColors: visionAnalysis?.dominant_colors || [],
        aiObjects: visionAnalysis?.objects || [],
        visionConfidence: visionAnalysis?.confidence || 0,
        isVisionAnalyzed: !!visionAnalysis && !visionAnalysis.is_fallback,
      };
      
      // Call smart contract to mint NFT
      const mintTx = await stellarClient.sendTransaction(
        new SorobanRpc.TransactionBuilder(userAddress, {
          fee: 100,
          networkPassphrase: get().network,
        })
        .addOperation(
          new SorobanRpc.Operation.invokeHostFunction({
            contract: new SorobanRpc.Contract(contracts.artAssetToken),
            functionName: 'mint',
            args: [
              new SorobanRpc.Address(userAddress),
              1, // Amount for NFT
              JSON.stringify(metadata),
              params.contentHash || '0x0000000000000000000000000000000000000000',
            ],
          })
        )
        .build()
      );
      
      // Add to local state
      const newArtwork = {
        id: Date.now().toString(),
        tokenUri: `https://api.muse.art/metadata/${Date.now()}`,
        imageUrl: aiGeneratedImage,
        metadata,
        owner: userAddress,
        createdAt: new Date().toISOString(),
      };
      
      set(state => ({
        artworks: [...state.artworks, newArtwork],
        isLoading: false,
      }));
      
      return newArtwork;
      
    } catch (error) {
      console.error('Failed to create artwork:', error);
      set({ 
        error: error.message, 
        isLoading: false,
        isAnalyzing: false
      });
      throw error;
    }
  },
  
  // AI artwork generation
  generateArtwork: async (params) => {
    try {
      // In real implementation, this would call AI APIs
      // For now, return a placeholder
      const aiModels = {
        'stable-diffusion': 'https://api.muse.art/generated/stable-diffusion.jpg',
        'dall-e-3': 'https://api.muse.art/generated/dall-e-3.jpg',
        'midjourney': 'https://api.muse.art/generated/midjourney.jpg',
      };
      
      return aiModels[params.aiModel] || aiModels['stable-diffusion'];
      
    } catch (error) {
      console.error('Failed to generate artwork:', error);
      throw error;
    }
  },
  
  // Marketplace functions
  listArtwork: async (tokenId, price, duration) => {
    try {
      set({ isLoading: true, error: null });
      
      const { stellarClient, contracts, userAddress } = get();
      if (!stellarClient || !userAddress) throw new Error('Not connected to Stellar');
      
      const listTx = await stellarClient.sendTransaction(
        new SorobanRpc.TransactionBuilder(userAddress, {
          fee: 100,
          networkPassphrase: get().network,
        })
        .addOperation(
          new SorobanRpc.Operation.invokeHostFunction({
            contract: new SorobanRpc.Contract(contracts.nftMarketplace),
            functionName: 'list_nft',
            args: [
              new SorobanRpc.Address(userAddress),
              tokenId,
              price,
              duration,
            ],
          })
        )
        .build()
      );
      
      // Update local state
      const newListing = {
        id: Date.now().toString(),
        tokenId,
        seller: userAddress,
        price,
        duration,
        expires: Date.now() + duration * 1000,
        active: true,
      };
      
      set(state => ({
        listings: [...state.listings, newListing],
        isLoading: false,
      }));
      
      return newListing;
      
    } catch (error) {
      console.error('Failed to list artwork:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  buyArtwork: async (tokenId, amount) => {
    try {
      set({ isLoading: true, error: null });
      
      const { stellarClient, contracts, userAddress } = get();
      if (!stellarClient || !userAddress) throw new Error('Not connected to Stellar');
      
      const buyTx = await stellarClient.sendTransaction(
        new SorobanRpc.TransactionBuilder(userAddress, {
          fee: 100,
          networkPassphrase: get().network,
        })
        .addOperation(
          new SorobanRpc.Operation.invokeHostFunction({
            contract: new SorobanRpc.Contract(contracts.nftMarketplace),
            functionName: 'buy_nft',
            args: [
              new SorobanRpc.Address(userAddress),
              tokenId,
              amount,
            ],
          })
        )
        .build()
      );
      
      // Update local state
      set(state => ({
        listings: state.listings.filter(listing => listing.tokenId !== tokenId),
        isLoading: false,
      }));
      
      return buyTx;
      
    } catch (error) {
      console.error('Failed to buy artwork:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Evolution functions
  evolveArtwork: async (tokenId, evolutionPrompt) => {
    try {
      set({ isLoading: true, error: null });
      
      const { stellarClient, contracts, userAddress } = get();
      if (!stellarClient || !userAddress) throw new Error('Not connected to Stellar');
      
      // Generate evolved artwork
      const evolvedImage = await get().generateEvolvedArtwork(tokenId, evolutionPrompt);
      
      // Update artwork in local state
      set(state => ({
        artworks: state.artworks.map(artwork => 
          artwork.id === tokenId 
            ? { 
                ...artwork, 
                imageUrl: evolvedImage,
                evolutionCount: (artwork.evolutionCount || 0) + 1,
                lastEvolved: new Date().toISOString(),
              }
            : artwork
        ),
        isLoading: false,
      }));
      
      return evolvedImage;
      
    } catch (error) {
      console.error('Failed to evolve artwork:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  generateEvolvedArtwork: async (tokenId, prompt) => {
    // In real implementation, this would use the original artwork + prompt
    return `https://api.muse.art/evolved/${tokenId}?prompt=${encodeURIComponent(prompt)}`;
  },
  
  // Data loading functions
  loadMarketplaceData: async () => {
    try {
      const { stellarClient, contracts } = get();
      if (!stellarClient || !contracts.nftMarketplace) return;
      
      // Load active listings from contract
      const listings = await stellarClient.getContractData(
        contracts.nftMarketplace,
        'get_active_listings',
        []
      );
      
      set({ listings: listings || [] });
      
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    }
  },
  
  loadUserArtworks: async (userAddress) => {
    try {
      // In real implementation, this would query the contract
      // For now, return empty array
      set({ artworks: [] });
      
    } catch (error) {
      console.error('Failed to load user artworks:', error);
    }
  },
  
  // Getters
  getArtworkById: (tokenId) => {
    const { artworks } = get();
    return artworks.find(artwork => artwork.id === tokenId);
  },
  
  getActiveListings: () => {
    const { listings } = get();
    const now = Date.now();
    return listings.filter(listing => listing.active && listing.expires > now);
  },
  
  getUserListings: (userAddress) => {
    const { listings } = get();
    return listings.filter(listing => listing.seller === userAddress);
  },

  // Transaction history functions
  fetchTransactions: async (userAddress, limit = 10, page = 1) => {
    try {
      const { horizonServer } = get();
      if (!horizonServer || !userAddress) throw new Error('Not connected to Horizon');

      const transactions = await horizonServer
        .transactions()
        .forAccount(userAddress)
        .limit(limit)
        .order('desc')
        .call();

      return transactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  },

  fetchWutaWutaTransactions: async (userAddress, limit = 10, page = 1) => {
    try {
      const transactions = await get().fetchTransactions(userAddress, limit, page);
      
      // Filter transactions related to Wuta-Wuta contract
      const wutaWutaTxs = await Promise.all(
        transactions.records.map(async (tx) => {
          const isWutaWutaTx = await get().isWutaWutaTransaction(tx);
          return isWutaWutaTx ? get().formatTransaction(tx) : null;
        })
      );

      return wutaWutaTxs.filter(tx => tx !== null);
    } catch (error) {
      console.error('Failed to fetch Wuta-Wuta transactions:', error);
      throw error;
    }
  },

  isWutaWutaTransaction: async (transaction) => {
    try {
      const { contracts } = get();
      if (!contracts.nftMarketplace) return true; // If no contract specified, show all transactions
      
      // Check if transaction involves Wuta-Wuta contract
      const operations = transaction.operations || [];
      return operations.some(op => 
        op.type === 'invoke_host_function' && 
        op.contract_id === contracts.nftMarketplace
      );
    } catch (error) {
      console.error('Error checking transaction:', error);
      return false;
    }
  },

  formatTransaction: (transaction) => {
    const operations = transaction.operations || [];
    const mainOperation = operations[0] || {};
    
    return {
      id: transaction.id,
      hash: transaction.hash,
      createdAt: transaction.created_at,
      status: transaction.successful ? 'success' : 'failed',
      type: get().getTransactionType(mainOperation),
      amount: get().getTransactionAmount(mainOperation),
      fee: transaction.fee_paid,
      memo: transaction.memo || '',
      operations: operations,
      ledger: transaction.ledger_attr,
      sourceAccount: transaction.source_account
    };
  },

  getTransactionType: (operation) => {
    switch (operation.type) {
      case 'payment':
        return 'Payment';
      case 'invoke_host_function':
        return 'Contract Call';
      case 'create_account':
        return 'Account Creation';
      case 'manage_data':
        return 'Data Management';
      case 'set_options':
        return 'Account Settings';
      case 'change_trust':
        return 'Trust Line';
      case 'allow_trust':
        return 'Allow Trust';
      case 'account_merge':
        return 'Account Merge';
      case 'inflation':
        return 'Inflation';
      case 'manage_buy_offer':
        return 'Buy Offer';
      case 'manage_sell_offer':
        return 'Sell Offer';
      case 'create_passive_sell_offer':
        return 'Passive Sell Offer';
      case 'path_payment_strict_receive':
        return 'Path Payment';
      case 'path_payment_strict_send':
        return 'Path Payment';
      default:
        return 'Unknown';
    }
  },

  getTransactionAmount: (operation) => {
    if (operation.type === 'payment' && operation.amount) {
      return {
        value: operation.amount,
        asset: operation.asset_code || 'XLM'
      };
    }
    return null;
  },

  // Vision AI functions
  analyzeExistingArtwork: async (artworkId) => {
    try {
      set({ isAnalyzing: true, error: null });
      
      const { artworks } = get();
      const artwork = artworks.find(a => a.id === artworkId);
      
      if (!artwork) {
        throw new Error('Artwork not found');
      }
      
      // Analyze artwork with Vision AI
      const visionAnalysis = await visionService.analyzeArtwork(artwork.imageUrl, artwork.metadata?.prompt || '');
      
      // Update artwork metadata with vision analysis
      const updatedMetadata = {
        ...artwork.metadata,
        aiDescription: visionAnalysis.description,
        aiTags: visionAnalysis.tags,
        aiStyle: visionAnalysis.style,
        aiMood: visionAnalysis.mood,
        aiColors: visionAnalysis.dominant_colors,
        aiObjects: visionAnalysis.objects,
        visionConfidence: visionAnalysis.confidence,
        isVisionAnalyzed: !visionAnalysis.is_fallback,
      };
      
      // Update artwork in state
      set(state => ({
        artworks: state.artworks.map(a => 
          a.id === artworkId 
            ? { ...a, metadata: updatedMetadata }
            : a
        ),
        isAnalyzing: false,
      }));
      
      return visionAnalysis;
      
    } catch (error) {
      console.error('Failed to analyze existing artwork:', error);
      set({ 
        error: error.message, 
        isAnalyzing: false 
      });
      throw error;
    }
  },

  batchAnalyzeArtworks: async (artworkIds) => {
    try {
      set({ isAnalyzing: true, error: null });
      
      const { artworks } = get();
      const artworksToAnalyze = artworkIds.map(id => {
        const artwork = artworks.find(a => a.id === id);
        return {
          id,
          imageUrl: artwork.imageUrl,
          prompt: artwork.metadata?.prompt || ''
        };
      });
      
      const results = await visionService.batchAnalyze(artworksToAnalyze);
      
      // Update artworks with successful analyses
      const updatedArtworks = artworks.map(artwork => {
        const result = results.find(r => r.id === artwork.id && r.success);
        if (result) {
          return {
            ...artwork,
            metadata: {
              ...artwork.metadata,
              aiDescription: result.analysis.description,
              aiTags: result.analysis.tags,
              aiStyle: result.analysis.style,
              aiMood: result.analysis.mood,
              aiColors: result.analysis.dominant_colors,
              aiObjects: result.analysis.objects,
              visionConfidence: result.analysis.confidence,
              isVisionAnalyzed: !result.analysis.is_fallback,
            }
          };
        }
        return artwork;
      });
      
      set(state => ({
        artworks: updatedArtworks,
        isAnalyzing: false,
      }));
      
      return results;
      
    } catch (error) {
      console.error('Failed to batch analyze artworks:', error);
      set({ 
        error: error.message, 
        isAnalyzing: false 
      });
      throw error;
    }
  },

  // Enhanced search functions
  searchArtworks: (query, filters = {}) => {
    const { artworks } = get();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm && Object.keys(filters).length === 0) {
      return artworks;
    }
    
    return artworks.filter(artwork => {
      const metadata = artwork.metadata || {};
      
      // Search in original prompt
      const promptMatch = metadata.prompt?.toLowerCase().includes(searchTerm);
      
      // Search in AI-generated description
      const descriptionMatch = metadata.aiDescription?.toLowerCase().includes(searchTerm);
      
      // Search in AI-generated tags
      const tagsMatch = metadata.aiTags?.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      
      // Search in AI objects
      const objectsMatch = metadata.aiObjects?.some(obj => 
        typeof obj === 'string' 
          ? obj.toLowerCase().includes(searchTerm)
          : obj.name?.toLowerCase().includes(searchTerm)
      );
      
      // Search in style
      const styleMatch = metadata.aiStyle?.toLowerCase().includes(searchTerm);
      
      // Search in mood
      const moodMatch = metadata.aiMood?.toLowerCase().includes(searchTerm);
      
      // Search in colors
      const colorsMatch = metadata.aiColors?.some(color => 
        typeof color === 'string' 
          ? color.toLowerCase().includes(searchTerm)
          : color.name?.toLowerCase().includes(searchTerm)
      );
      
      const matchesSearch = promptMatch || descriptionMatch || tagsMatch || 
                          objectsMatch || styleMatch || moodMatch || colorsMatch;
      
      // Apply filters
      let matchesFilters = true;
      
      if (filters.style && filters.style !== 'all') {
        matchesFilters = metadata.aiStyle === filters.style;
      }
      
      if (filters.mood && filters.mood !== 'all') {
        matchesFilters = metadata.aiMood === filters.mood;
      }
      
      if (filters.hasVisionAnalysis) {
        matchesFilters = metadata.isVisionAnalyzed === true;
      }
      
      if (filters.aiModel && filters.aiModel !== 'all') {
        matchesFilters = metadata.aiModel === filters.aiModel;
      }
      
      return matchesSearch && matchesFilters;
    });
  },

  getPopularTags: () => {
    const { artworks } = get();
    const tagCounts = {};
    
    artworks.forEach(artwork => {
      const tags = artwork.metadata?.aiTags || [];
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));
  },

  getAvailableStyles: () => {
    const { artworks } = get();
    const styles = new Set();
    
    artworks.forEach(artwork => {
      const style = artwork.metadata?.aiStyle;
      if (style && style !== 'unknown') {
        styles.add(style);
      }
    });
    
    return Array.from(styles).sort();
  },

  getAvailableMoods: () => {
    const { artworks } = get();
    const moods = new Set();
    
    artworks.forEach(artwork => {
      const mood = artwork.metadata?.aiMood;
      if (mood && mood !== 'neutral') {
        moods.add(mood);
      }
    });
    
    return Array.from(moods).sort();
  },
}));

export { useMuseStore };

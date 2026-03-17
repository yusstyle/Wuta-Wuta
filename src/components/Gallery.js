import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gallery, 
  Search, 
  Filter, 
  Heart, 
  ShoppingCart,
  Eye,
  Clock,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import { useWalletStore } from '../store/walletStore';
import toast from 'react-hot-toast';

const Gallery = () => {
  const { 
    artworks, 
    listings, 
    buyArtwork, 
    getActiveListings, 
    getUserListings,
    isLoading 
  } = useMuseStore();
  const { address } = useWalletStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  
  useEffect(() => {
    // Load marketplace data
    getActiveListings();
  }, [getActiveListings]);
  
  const filteredArtworks = artworks.filter(artwork => {
    const matchesSearch = artwork.metadata.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = filterModel === 'all' || artwork.metadata.aiModel === filterModel;
    const listing = listings.find(l => l.tokenId === artwork.id);
    const matchesPrice = filterPrice === 'all' || 
      (filterPrice === 'under-100' && listing && listing.price < 100) ||
      (filterPrice === '100-500' && listing && listing.price >= 100 && listing.price <= 500) ||
      (filterPrice === 'over-500' && listing && listing.price > 500);
    
    return matchesSearch && matchesModel && matchesPrice;
  });
  
  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'price-low':
        const priceA = listings.find(l => l.tokenId === a.id)?.price || 0;
        const priceB = listings.find(l => l.tokenId === b.id)?.price || 0;
        return priceA - priceB;
      case 'price-high':
        const priceHighA = listings.find(l => l.tokenId === a.id)?.price || 0;
        const priceHighB = listings.find(l => l.tokenId === b.id)?.price || 0;
        return priceHighB - priceHighA;
      default:
        return 0;
    }
  });
  
  const handleBuyArtwork = async (tokenId, price) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    try {
      await buyArtwork(tokenId, price);
      toast.success('Artwork purchased successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to purchase artwork');
    }
  };
  
  const getListingForArtwork = (artworkId) => {
    return listings.find(listing => listing.tokenId === artworkId);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Art Gallery</h1>
        <p className="text-gray-600">Explore and collect AI-human collaborative artwork</p>
      </div>
      
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search artworks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          {/* AI Model Filter */}
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Models</option>
            <option value="stable-diffusion">Stable Diffusion</option>
            <option value="dall-e-3">DALL-E 3</option>
            <option value="midjourney">Midjourney</option>
          </select>
          
          {/* Price Filter */}
          <select
            value={filterPrice}
            onChange={(e) => setFilterPrice(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Prices</option>
            <option value="under-100">Under 100 XLM</option>
            <option value="100-500">100-500 XLM</option>
            <option value="over-500">Over 500 XLM</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </motion.div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center">
            <Gallery className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{artworks.length}</p>
              <p className="text-sm text-gray-600">Total Artworks</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center">
            <ShoppingCart className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{getActiveListings().length}</p>
              <p className="text-sm text-gray-600">Active Listings</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {getActiveListings().reduce((sum, listing) => sum + listing.price, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Value (XLM)</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-4"
        >
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {artworks.filter(a => a.metadata.canEvolve).length}
              </p>
              <p className="text-sm text-gray-600">Evolvable Art</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedArtworks.map((artwork, index) => {
          const listing = getListingForArtwork(artwork.id);
          const isOwner = artwork.owner === address;
          
          return (
            <motion.div
              key={artwork.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Image */}
              <div className="relative aspect-square">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.metadata.prompt}
                  className="w-full h-full object-cover"
                />
                
                {listing && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    For Sale
                  </div>
                )}
                
                {artwork.metadata.canEvolve && (
                  <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Evolvable
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {artwork.metadata.prompt}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(artwork.createdAt).toLocaleDateString()}
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                    {artwork.metadata.aiModel}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-xs text-gray-600">
                      Human: {artwork.metadata.humanContribution}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-xs text-gray-600">
                      AI: {artwork.metadata.aiContribution}%
                    </span>
                  </div>
                </div>
                
                {listing && !isOwner && (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {listing.price} XLM
                      </span>
                      <span className="text-xs text-gray-500">
                        ~${(listing.price * 0.13).toFixed(2)} USD
                      </span>
                    </div>
                    <button
                      onClick={() => handleBuyArtwork(artwork.id, listing.price)}
                      disabled={isLoading}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center justify-center text-sm"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Buy Now
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {isOwner && (
                  <div className="border-t pt-3">
                    <div className="text-center text-sm text-gray-500">
                      You own this artwork
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Empty State */}
      {sortedArtworks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Gallery className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No artworks found</h3>
          <p className="text-gray-600">
            {searchTerm || filterModel !== 'all' || filterPrice !== 'all'
              ? 'Try adjusting your filters'
              : 'Be the first to create an artwork!'
            }
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Gallery;

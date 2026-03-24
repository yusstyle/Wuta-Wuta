import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShoppingCart, Sparkles, Eye, Tag } from 'lucide-react';

const ArtworkGrid = ({ 
  artworks, 
  listings = [], 
  onBuyArtwork, 
  isLoading, 
  address,
  onAnalyzeArtwork 
}) => {
  const getListingForArtwork = (artworkId) => {
    return listings.find(listing => listing.tokenId === artworkId);
  };

  if (!artworks || artworks.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 transition-all duration-500 ease-in-out">
      {artworks.map((artwork, index) => {
        const listing = getListingForArtwork(artwork.id);
        const isOwner = artwork.owner === address;
        
        return (
          <motion.div
            key={artwork.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden group bg-gray-100">
              <img
                src={artwork.imageUrl}
                alt={artwork.metadata?.prompt || artwork.title || 'Artwork'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Overlays */}
              <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start pointer-events-none">
                <div className="flex gap-2">
                  {artwork.metadata?.canEvolve && (
                    <div className="bg-purple-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Evolvable</span>
                    </div>
                  )}
                  {artwork.metadata?.isVisionAnalyzed && (
                    <div className="bg-blue-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>Vision AI</span>
                    </div>
                  )}
                </div>
                <div className="flex-1"></div>
                {listing && (
                  <div className="bg-green-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                    For Sale
                  </div>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 sm:p-5 flex flex-col flex-grow bg-white">
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base sm:text-lg leading-tight" title={artwork.metadata?.prompt || artwork.title}>
                {artwork.metadata?.prompt || artwork.title || 'Untitled'}
              </h3>
              
              {/* AI-generated description */}
              {artwork.metadata?.aiDescription && (
                <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 italic">
                  "{artwork.metadata.aiDescription}"
                </p>
              )}
              
              {/* AI-generated tags */}
              {artwork.metadata?.aiTags && artwork.metadata.aiTags.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-2">
                    <Tag className="w-3 h-3 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">AI Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {artwork.metadata.aiTags.slice(0, 4).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium border border-purple-100"
                      >
                        {tag}
                      </span>
                    ))}
                    {artwork.metadata.aiTags.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-xs font-medium">
                        +{artwork.metadata.aiTags.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-4 mt-auto">
                <span className="flex items-center font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {new Date(artwork.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {artwork.metadata?.aiModel && (
                  <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                    {artwork.metadata.aiModel}
                  </span>
                )}
              </div>
              
              {/* Contributions */}
              {artwork.metadata?.humanContribution !== undefined && (
                <div className="space-y-2 mb-4">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ width: `${artwork.metadata.humanContribution}%` }}
                    ></div>
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${artwork.metadata.aiContribution}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-gray-500">
                    <span className="text-purple-600">Human {artwork.metadata.humanContribution}%</span>
                    <span className="text-blue-600">AI {artwork.metadata.aiContribution}%</span>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              {listing && !isOwner && onBuyArtwork && (
                <div className="border-t border-gray-100 pt-4 mt-1">
                  <div className="flex items-end justify-between mb-3 sm:mb-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-0.5">Current Price</p>
                      <span className="text-lg sm:text-xl font-black text-gray-900 leading-none">
                        {listing.price} XLM
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 font-medium mb-0.5">
                      ~${(listing.price * 0.13).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => onBuyArtwork(artwork.id, listing.price)}
                    disabled={isLoading}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center justify-center text-sm font-bold shadow-md hover:shadow-lg transform active:scale-95"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Buy Artwork
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {isOwner && (
                <div className="border-t border-gray-100 pt-3 sm:pt-4 mt-1">
                  {!artwork.metadata?.isVisionAnalyzed && onAnalyzeArtwork && (
                    <button
                      onClick={() => onAnalyzeArtwork(artwork.id)}
                      className="w-full mb-2 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Analyze with Vision AI
                    </button>
                  )}
                  <div className="bg-gray-50 text-gray-600 text-xs sm:text-sm font-semibold py-2.5 rounded-lg text-center border border-gray-200">
                    Owned by You
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ArtworkGrid;
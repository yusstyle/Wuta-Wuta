import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Sparkles, 
  Upload, 
  Settings, 
  Zap,
  Image,
  Type,
  Sliders
} from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import { useWalletStore } from '../store/walletStore';
import toast from 'react-hot-toast';

const CreateArt = () => {
  const { createCollaborativeArtwork, aiModels, isLoading } = useMuseStore();
  const { address } = useWalletStore();
  
  // Form state
  const [formData, setFormData] = useState({
    prompt: '',
    aiModel: 'stable-diffusion',
    humanContribution: 60,
    aiContribution: 40,
    canEvolve: true,
    style: 'realistic',
    aspectRatio: '1:1',
    quality: 'high',
  });
  
  // Canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [humanInput, setHumanInput] = useState(null);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleContributionChange = (type, value) => {
    const otherType = type === 'human' ? 'ai' : 'human';
    const otherValue = 100 - value;
    
    setFormData(prev => ({
      ...prev,
      [`${type}Contribution`]: value,
      [`${otherType}Contribution`]: otherValue
    }));
  };
  
  const handleCanvasDraw = (e) => {
    if (!canvasRef.current || !isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#8b5cf6';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const startDrawing = (e) => {
    setIsDrawing(true);
    handleCanvasDraw(e);
  };
  
  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      setIsDrawing(false);
      
      // Save canvas as image
      const imageData = canvasRef.current.toDataURL();
      setHumanInput(imageData);
    }
  };
  
  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHumanInput(null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!formData.prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    try {
      const artwork = await createCollaborativeArtwork({
        ...formData,
        humanInput,
        contentHash: humanInput ? '0x' + btoa(humanInput).slice(0, 40) : '0x0000000000000000000000000000000000000000',
      });
      
      toast.success('Artwork created successfully!');
      clearCanvas();
      setFormData({
        prompt: '',
        aiModel: 'stable-diffusion',
        humanContribution: 60,
        aiContribution: 40,
        canEvolve: true,
        style: 'realistic',
        aspectRatio: '1:1',
        quality: 'high',
      });
      
    } catch (error) {
      toast.error(error.message || 'Failed to create artwork');
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Create AI-Human Art</h1>
        <p className="text-gray-600">Collaborate with AI to create unique digital artwork</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* AI Model Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">AI Model</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleInputChange('aiModel', model.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.aiModel === model.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {model.type === 'image' ? (
                      <Image className="w-6 h-6 text-purple-600" />
                    ) : (
                      <Type className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="text-sm font-medium">{model.name}</div>
                </button>
              ))}
            </div>
          </motion.div>
          
          {/* Prompt Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center mb-4">
              <Type className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">Art Prompt</h3>
            </div>
            
            <textarea
              value={formData.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              placeholder="Describe your artwork... (e.g., 'Abstract cosmic landscape with swirling colors')"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
            
            <div className="mt-4 flex flex-wrap gap-2">
              {['Abstract', 'Realistic', 'Surreal', 'Cosmic', 'Nature', 'Urban'].map((style) => (
                <button
                  key={style}
                  onClick={() => handleInputChange('prompt', 
                    formData.prompt ? `${formData.prompt}, ${style.toLowerCase()}` : style.toLowerCase()
                  )}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                >
                  {style}
                </button>
              ))}
            </div>
          </motion.div>
          
          {/* Collaboration Split */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center mb-4">
              <Sliders className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">Collaboration Split</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Human Contribution</span>
                  <span className="text-sm text-purple-600">{formData.humanContribution}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.humanContribution}
                  onChange={(e) => handleContributionChange('human', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">AI Contribution</span>
                  <span className="text-sm text-blue-600">{formData.aiContribution}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.aiContribution}
                  onChange={(e) => handleContributionChange('ai', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
          
          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">Advanced Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Style</label>
                <select
                  value={formData.style}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="realistic">Realistic</option>
                  <option value="abstract">Abstract</option>
                  <option value="surreal">Surreal</option>
                  <option value="cartoon">Cartoon</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                <select
                  value={formData.aspectRatio}
                  onChange={(e) => handleInputChange('aspectRatio', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="1:1">Square (1:1)</option>
                  <option value="16:9">Landscape (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                  <option value="4:3">Standard (4:3)</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="canEvolve"
                  checked={formData.canEvolve}
                  onChange={(e) => handleInputChange('canEvolve', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="canEvolve" className="text-sm font-medium">
                  Allow artwork to evolve over time
                </label>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Right Column - Canvas */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Palette className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold">Human Input Canvas</h3>
              </div>
              <button
                onClick={clearCanvas}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full border-2 border-gray-300 rounded-lg cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={handleCanvasDraw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              
              {!humanInput && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-gray-400">
                    <Upload className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Draw your initial concept</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>Tip:</strong> Your drawing will be combined with AI generation to create a unique collaborative artwork.
              </p>
            </div>
          </motion.div>
          
          {/* Create Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={handleSubmit}
              disabled={isLoading || !address}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Artwork...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Collaborative Artwork
                </>
              )}
            </button>
            
            {!address && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Connect your wallet to create artwork
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateArt;

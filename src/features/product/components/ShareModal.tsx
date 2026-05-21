import React, { useState } from 'react';
import { X, Copy, Check, Facebook, Twitter, MessageCircle, Mail, Share2, Instagram } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productUrl: string;
  productImage?: string;
  productPrice?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  productName,
  productUrl,
  productImage,
  productPrice
}) => {
  const [copied, setCopied] = useState(false);

  // Detect if user is on mobile device
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Add UTM parameters to URL for mobile sharing
  const addUtmParams = (url: string, source: string) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=${source}&utm_medium=social&utm_campaign=product_share`;
  };

  if (!isOpen) return null;

  const shareText = `Check out this amazing product: ${productName}${productPrice ? ` for just ₹${productPrice}` : ''} on FiCi website!`;
  const encodedText = encodeURIComponent(shareText);
  
  // Prepare URL with UTM parameters for mobile sharing
  const urlForSharing = isMobileDevice() ? addUtmParams(productUrl, 'mobile_share') : productUrl;
  const encodedUrl = encodeURIComponent(urlForSharing);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodedText}%20${encodeURIComponent(productUrl.includes('?') ? `${productUrl}&utm_source=whatsapp&utm_medium=social&utm_campaign=product_share` : `${productUrl}?utm_source=whatsapp&utm_medium=social&utm_campaign=product_share`)}`,
      action: 'share'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/messages/compose/?text=${encodedText}%20${encodeURIComponent(productUrl.includes('?') ? `${productUrl}&utm_source=facebook&utm_medium=social&utm_campaign=product_share` : `${productUrl}?utm_source=facebook&utm_medium=social&utm_campaign=product_share`)}`,
      action: 'share'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/messages/compose?text=${encodedText}%20${encodeURIComponent(productUrl.includes('?') ? `${productUrl}&utm_source=twitter&utm_medium=social&utm_campaign=product_share` : `${productUrl}?utm_source=twitter&utm_medium=social&utm_campaign=product_share`)}`,
      action: 'share'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600',
      url: `https://www.instagram.com/`,
      action: 'copy'
    }
  ];

  const handleShare = (url: string, action: string = 'share') => {
    if (action === 'copy') {
      // For Instagram, copy the URL to clipboard and open Instagram
      const urlToCopy = isMobileDevice() ? addUtmParams(productUrl, 'instagram_copy') : productUrl;
      navigator.clipboard.writeText(urlToCopy);
      window.open('https://www.instagram.com/', '_blank');
    } else {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = async () => {
    try {
      // Copy URL with UTM parameters if on mobile
      const urlToCopy = isMobileDevice() ? addUtmParams(productUrl, 'mobile_copy') : productUrl;
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      const urlToCopy = isMobileDevice() ? addUtmParams(productUrl, 'mobile_copy') : productUrl;
      textArea.value = urlToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Native mobile share handler
  const handleNativeShare = async () => {
    if (navigator.share && isMobileDevice()) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: addUtmParams(productUrl, 'mobile_native')
        });
      } catch (error) {
        console.log('Native share cancelled or failed:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Share Product
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {productImage && (
              <img
                src={productImage}
                alt={productName}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                {productName}
              </h3>
              {productPrice && (
                <p className="text-lg font-semibold text-primary mt-1">
                  ₹{productPrice}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Share on social media
          </h3>
          
          {/* Native Mobile Share Button */}
          {navigator.share && isMobileDevice() && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors mb-4"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
          )}
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleShare(option.url, option.action)}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg text-white transition-colors ${option.color}`}
              >
                <option.icon className="w-5 h-5" />
                <span className="font-medium">{option.name}</span>
              </button>
            ))}
          </div>

          {/* Copy Link */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Or copy link
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300 truncate">
                {isMobileDevice() ? addUtmParams(productUrl, 'mobile_copy') : productUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className={`flex items-center justify-center p-3 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Link copied to clipboard!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

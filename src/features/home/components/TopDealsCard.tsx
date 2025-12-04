import React from 'react';
import { Link } from 'react-router-dom';

interface TopDealsCardProps {
    title: string;
    rating: number;
    price: number;
    originalPrice?: number;
    reviews: number;
    image: string;
    link: string;
    discountPercentage?: number;
    className?: string;
}

const TopDealsCard: React.FC<TopDealsCardProps> = ({
    title,
    price,
    originalPrice,
    image,
    link,
    className = '',
    discountPercentage = 0
}) => {
  return (
    <Link to={link} className={`w-full p-2 sm:p-3 lg:p-4 flex flex-col gap-2 hover:bg-white hover:rounded-2xl transition-all duration-300 ${className}`}>
        <div className={`relative group bg-white dark:bg-dark2 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col`}>
            <div className="relative aspect-[3/4] w-full">
              <img
                src={image}
                alt={title}
                className="absolute inset-0 w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== '/assets/Fici_logo.png') {
                  target.src = '/assets/Fici_logo.png';
                }
              }}
            />
            </div>
            {discountPercentage > 0 && (
              <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-[color:var(--color-accent)] text-white px-1 sm:px-2 py-1 rounded text-xs font-medium">
                {discountPercentage}% OFF
              </div>
            )}
        </div>
        <div className='flex flex-col gap-1 sm:gap-2'>
            <h3 className='text-sm sm:text-base lg:text-lg font-bold text-[color:var(--color-accent)] font-primary line-clamp-2 leading-tight'>
              {title}
            </h3>
            <div className='flex items-center gap-1 sm:gap-2 flex-wrap'>
              <p className='text-sm sm:text-base lg:text-lg text-[color:var(--color-primary)] font-bold font-primary'>
                ₹{price.toLocaleString('en-IN')}
              </p>
              {originalPrice && originalPrice > price && (
                <>
                  <p className='text-xs sm:text-sm text-gray-500 line-through'>
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </p>
                  <span className='text-xs bg-green-100 text-green-800 px-1 sm:px-2 py-1 rounded'>
                    Save ₹{(originalPrice - price).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </div>
        </div>
    </Link>
  );
};

export default TopDealsCard;
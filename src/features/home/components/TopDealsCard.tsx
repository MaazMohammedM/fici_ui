import { Heart } from 'lucide-react';
import React from 'react';
import StarComponent from 'utils/StarComponent';
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
}

const TopDealsCard: React.FC<TopDealsCardProps> = ({
    title, 
    rating, 
    price, 
    originalPrice,
    reviews, 
    image, 
    link,
    discountPercentage = 0
}) => {
  return (
    <Link to={link} className='w-full h-fit p-2 sm:p-3 lg:p-4 flex flex-col gap-2 hover:bg-white hover:rounded-2xl transition-all duration-300'>
        <div className='relative w-full h-24 sm:h-32 lg:h-40 rounded-xl sm:rounded-2xl overflow-hidden'>
            <img 
              src={image} 
              alt={title} 
              className='w-full h-full object-cover rounded-lg sm:rounded-xl'
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/path/to/fallback-image.jpg';
              }}
            />
            {discountPercentage > 0 && (
              <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-[color:var(--color-accent)] text-white px-1 sm:px-2 py-1 rounded text-xs font-medium">
                {discountPercentage}% OFF
              </div>
            )}
            <Heart 
              strokeWidth={0.5} 
              absoluteStrokeWidth 
              className='absolute top-1 sm:top-2 right-1 sm:right-2 text-white hover:fill-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] transition-colors cursor-pointer w-4 h-4 sm:w-5 sm:h-5' 
            />
        </div>
        <div className='flex flex-col gap-1 sm:gap-2'>
            <h3 className='text-sm sm:text-base lg:text-lg font-bold text-[color:var(--color-accent)] font-primary line-clamp-2 leading-tight'>
              {title}
            </h3>
            <div className='flex flex-col gap-1 sm:gap-2 items-start'>
                <StarComponent rating={rating} />
                <p className='text-xs sm:text-sm text-[color:var(--color-primary)] font-primary'>
                  ({reviews}) reviews
                </p>
            </div>
            <div className='flex items-center gap-1 sm:gap-2 flex-wrap'>
              <p className='text-sm sm:text-base lg:text-lg text-[color:var(--color-primary)] font-bold font-primary p-1 w-fit rounded'>
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
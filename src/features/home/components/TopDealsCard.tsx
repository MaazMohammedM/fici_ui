import { Heart } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import StarComponent from 'Utils/StarComponent';

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
    <Link to={link} className='w-full h-fit p-3 lg:p-4 flex flex-col gap-2 hover:bg-white hover:rounded-2xl transition-all duration-300'>
        <div className='relative w-full h-32 lg:h-40 rounded-2xl overflow-hidden'>
            <img 
              src={image} 
              alt={title} 
              className='w-full h-full object-cover rounded-lg'
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/path/to/fallback-image.jpg';
              }}
            />
            {discountPercentage > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                {discountPercentage}% OFF
              </div>
            )}
            <Heart strokeWidth={0.5} absoluteStrokeWidth className='absolute top-2 right-2 text-white hover:fill-red-500 hover:text-red-500 transition-colors cursor-pointer' />
        </div>
        <div className='flex flex-col gap-2'>
            <h3 className='text-base lg:text-lg font-bold text-accent font-primary line-clamp-2'>{title}</h3>
            <div className='flex flex-col gap-2 items-start'>
                <StarComponent rating={rating} />
                <p className='text-xs text-primary font-primary'>({reviews}) reviews</p>
            </div>
            <div className='flex items-center gap-2'>
              <p className='text-base lg:text-lg text-primary font-bold font-primary p-1 w-fit rounded'>₹{price}</p>
              {originalPrice && originalPrice > price && (
                <>
                  <p className='text-sm text-gray-500 line-through'>₹{originalPrice}</p>
                  <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                    Save ₹{originalPrice - price}
                  </span>
                </>
              )}
            </div>
        </div>
    </Link>
  );
};

export default TopDealsCard;
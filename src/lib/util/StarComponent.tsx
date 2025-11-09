import { LiaStarSolid } from "react-icons/lia";
import React from 'react';

interface StarComponentProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'gap-0.5', star: 'w-3 h-3' },
  md: { container: 'gap-1', star: 'w-4 h-4' },
  lg: { container: 'gap-1.5', star: 'w-5 h-5' },
};

const StarComponent: React.FC<StarComponentProps> = ({ rating, size = 'md' }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const { container, star } = sizeMap[size];

  return (
    <div className={`flex items-center ${container}`}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, index) => (
        <LiaStarSolid key={`full-${index}`} className={`${star} text-accent`} />
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <div className={`relative ${star}`}>
          <LiaStarSolid className={`${star} text-accent/50`} />
          <div className='absolute inset-0 overflow-hidden w-1/2'>
            <LiaStarSolid className={`${star} text-accent`} />
          </div>
        </div>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, index) => (
        <LiaStarSolid key={`empty-${index}`} className={`${star} text-accent/50`} />
      ))}
    </div>
  );
};

export default StarComponent;
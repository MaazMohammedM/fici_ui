import { LiaStarSolid } from "react-icons/lia";
import React from 'react'

const StarComponent:React.FC<{rating:number}> = ({rating}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className='flex gap-1 items-center'>
        {/* Full stars */}
        {Array.from({length: fullStars}).map((_, index) => (
            <LiaStarSolid key={`full-${index}`} className='w-4 h-4 text-accent' />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
            <div className='relative w-4 h-4'>
                <LiaStarSolid className='w-4 h-4 text-accent/50' />
                <div className='absolute inset-0 overflow-hidden w-2'>
                    <LiaStarSolid className='w-4 h-4 text-accent' />
                </div>
            </div>
        )}
        
        {/* Empty stars */}
        {Array.from({length: emptyStars}).map((_, index) => (
            <LiaStarSolid key={`empty-${index}`} className='w-4 h-4 text-accent/50' />
        ))}
    </div>
  )
}

export default StarComponent
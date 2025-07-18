import React from 'react'

interface PopularCategoryCardProps {
  category: string;
  categoryImage: string;
}

const PopularCategoryCard: React.FC<PopularCategoryCardProps> = ({ category, categoryImage }) => {
  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='w-40 h-40 bg-gradient-light dark:bg-gradient-dark rounded-full flex items-center justify-center'>
        <img src={categoryImage} alt={category} className='w-full h-full object-cover rounded-full' />
      </div>
      <h3 className='text-lg font-bold font-primary text-primary dark:text-secondary'>{category}</h3>
    </div>
  )
}

export default PopularCategoryCard
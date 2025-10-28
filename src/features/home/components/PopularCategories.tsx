import React from 'react'
import { Link } from 'react-router-dom'
import PopularCategoryCard from './PopularCategoryCard'
import { popularCategories } from '../data/popularCategories'
import { ArrowRightIcon } from 'lucide-react'

const PopularCategories:React.FC = () => {
  
  return (
    <section className='bg-gradient-light dark:bg-gradient-dark w-full py-8 sm:py-12 px-4 sm:px-8 lg:px-16'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
          <div>
            <h2 className='text-2xl sm:text-3xl font-bold font-secondary text-primary dark:text-secondary'>
              Popular Categories
            </h2>
            <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1'>
              Explore our curated collections
            </p>
          </div>
          <Link 
            to="/products" 
            className='text-accent hover:text-accent/80 font-secondary text-base sm:text-lg font-semibold flex items-center gap-1 transition-colors'
          >
            View All <ArrowRightIcon className='w-4 h-4' />
          </Link>
        </div>
        
        <div className='w-full'>
          <div className='grid grid-flow-col auto-cols-[40%] sm:auto-cols-[30%] md:auto-cols-[22%] lg:auto-cols-[18%] xl:auto-cols-[16%] gap-4 sm:gap-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide'>
            {popularCategories.map((cat) => (
              <PopularCategoryCard 
                key={cat.key} 
                category={cat.categoryName} 
                categoryImage={cat.categoryImage} 
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PopularCategories
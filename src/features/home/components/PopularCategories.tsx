import React from 'react'
import { Link } from 'react-router-dom'
import PopularCategoryCard from './PopularCategoryCard'
import { popularCategories } from '../data/popularCategories'
import { ArrowRightIcon } from 'lucide-react'

const PopularCategories:React.FC = () => {
  
  return (
    <section className='bg-gradient-light dark:bg-gradient-dark h-[50svh] w-full px-16 flex flex-col gap-4 justify-center'>
        <div className='flex justify-between items-center  w-full'>
            <h2 className='text-xl font-bold font-secondary text-primary dark:text-secondary'>Popular Categories</h2>
            <Link to="/products" className='text-accent font-secondary text-lg font-bold flex items-center gap-2'>View All <ArrowRightIcon className='w-4 h-4' /></Link>
        </div>
        <div className='w-full px-5'>
          <div
            
            className='flex items-center gap-10 w-full overflow-x-scroll scrollbar-hide'
            style={{ scrollBehavior: 'smooth' }}
          >
            {
                popularCategories.map((cat) => (
                    <PopularCategoryCard key={cat.key} category={cat.categoryName} categoryImage={cat.categoryImage} />
                ))
            }
          </div>
        </div>
    </section>
  )
}

export default PopularCategories
import React from 'react'
import TopDealsCard from './TopDealsCard'
import { TopDealItems } from '../data/TopDeals'

const TopDealsSection:React.FC = () => {
  return (
    <div className='bg-gradient-light dark:bg-gradient-dark h-[70svh] w-full px-16 flex flex-col gap-4 justify-center'>
        <div className='flex justify-between items-center  w-full'>
            <h2 className='text-xl font-bold font-secondary text-primary dark:text-secondary'>Amazing deals for you!</h2>
        </div>
      
          <div
            
            className='flex items-start gap-10 w-full'
            
          >
            {
                TopDealItems.map((deals) => (
                    <TopDealsCard title={deals?.title ?? ''} rating={deals?.rating ?? 0} price={deals?.price ??  0} reviews={deals?.reviews ?? 0} image={deals?.image ?? ''} link={deals?.link ?? ''}  />
                ))
            }
          </div>
        </div>
  )
}

export default TopDealsSection
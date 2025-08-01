import { Heart } from 'lucide-react';
import React from 'react'
import { Link } from 'react-router-dom';
import StarComponent from 'Utils/StarComponent';

interface TopDealsCardProps {
    title: string;
    rating: number;
    price: number;
    reviews: number;
    image: string;
    link: string;
}

const TopDealsCard:React.FC<TopDealsCardProps> = ({title, rating, price, reviews, image, link}) => {
  return (
    <Link to={link} className='w-80 h-fit p-4 flex flex-col gap-2 hover:bg-white hover:rounded-2xl'>
        <div className='relative w-full h-40 rounded-2xl'>
            <img src={image} alt={title} className='w-full h-full object-cover rounded-lg' />
            <Heart strokeWidth={0.5} absoluteStrokeWidth className='absolute top-2 right-2' />
        </div>
        <div className='flex flex-col gap-2'>
            <h3 className='text-lg font-bold  text-accent font-primary'>{title}</h3>
            <div className='flex flex-col gap-2 items-start'>
                <StarComponent rating={rating} />
                <p className='text-xs text-primary font-primary'>({reviews}) reviews</p>
            </div>
            <p className='text-lg text-primary font-bold font-primary p-1 w-fit rounded'>{price}₹</p>
        </div>
        
    </Link>
  )
}

export default TopDealsCard
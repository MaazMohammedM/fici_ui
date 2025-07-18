import popularImageOne from '../assets/popular image one.png';
import popularImageTwo from '../assets/popular image two.png';
import popularImageThree from '../assets/popular image three.png';

export interface PopularCategory {
  key: number;
  categoryName: string;
  categoryImage: string;
}

export const popularCategories: PopularCategory[] = [
  {
    key: 1,
    categoryName: 'Loafers',
    categoryImage: popularImageOne,
  },
  {
    key: 2,
    categoryName: 'Sneakers',
    categoryImage: popularImageTwo,
  },
  {
    key: 3,
    categoryName: 'Boots',
    categoryImage: popularImageThree,
  },
  {
    key: 4,
    categoryName: 'Sandals',
    categoryImage: popularImageOne,
  },
  {
    key: 5,
    categoryName: 'Heels',
    categoryImage: popularImageTwo,
  },
  {
    key: 6,
    categoryName: 'Flats',
    categoryImage: popularImageThree,
  },
  {
    key: 7,
    categoryName: 'Slippers',
    categoryImage: popularImageOne,
  },
  {
    key: 8,
    categoryName: 'Oxfords',
    categoryImage: popularImageTwo,
  },
]; 
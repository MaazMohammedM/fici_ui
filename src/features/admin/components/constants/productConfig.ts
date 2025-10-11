export const CATEGORY_CONFIG = {
  'Footwear': {
    label: 'Footwear',
    subCategories: [
      { value: 'Shoes', label: 'Shoes' },
      { value: 'Sandals', label: 'Sandals' }
    ]
  },
  'Bags and Accessories': {
    label: 'Bags and Accessories',
    subCategories: [
      { value: 'Bags', label: 'Bags' },
      { value: 'Accessories', label: 'Accessories' }
    ]
  }
} as const;

export const GENDER_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'unisex', label: 'Unisex' }
] as const;
// Internationalization strings - ready for i18n library integration
// This structure makes it easy to integrate with react-i18next or similar libraries

export const strings = {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try again',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    next: 'Next',
    previous: 'Previous',
    continue: 'Continue',
    back: 'Back',
    home: 'Home',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    support: 'Support'
  },

  // Navigation
  nav: {
    home: 'Home',
    products: 'Products',
    categories: 'Categories',
    cart: 'Cart',
    orders: 'My Orders',
    profile: 'Profile',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    menu: 'Menu'
  },

  // Authentication
  auth: {
    signIn: {
      title: 'Welcome Back',
      subtitle: 'Sign in to your account to continue',
      email: 'Email Address',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      signUpLink: 'Sign up here',
      signInButton: 'Sign In',
      googleSignIn: 'Continue with Google'
    },
    signUp: {
      title: 'Create Account',
      subtitle: 'Join us and start shopping today',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      hasAccount: 'Already have an account?',
      signInLink: 'Sign in here',
      signUpButton: 'Create Account',
      googleSignUp: 'Continue with Google'
    },
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 8 characters',
      passwordsNoMatch: "Passwords don't match",
      nameRequired: 'Name is required',
      nameTooShort: 'Name must be at least 2 characters'
    }
  },

  // Products
  products: {
    title: 'Products',
    noProducts: 'No products found',
    loadMore: 'Load More',
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    inStock: 'In Stock',
    price: 'Price',
    size: 'Size',
    color: 'Color',
    quantity: 'Quantity',
    description: 'Description',
    specifications: 'Specifications',
    reviews: 'Reviews',
    relatedProducts: 'Related Products',
    searchPlaceholder: 'Search products...',
    filterBy: 'Filter by',
    sortBy: 'Sort by',
    priceRange: 'Price Range',
    category: 'Category',
    brand: 'Brand',
    rating: 'Rating'
  },

  // Cart
  cart: {
    title: 'Shopping Cart',
    empty: 'Your cart is empty',
    continueShopping: 'Continue Shopping',
    removeItem: 'Remove Item',
    updateQuantity: 'Update Quantity',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    tax: 'Tax',
    total: 'Total',
    checkout: 'Checkout',
    itemsCount: {
      zero: 'No items',
      one: '1 item',
      other: '{{count}} items'
    }
  },

  // Checkout
  checkout: {
    title: 'Checkout',
    guestCheckout: 'Guest Checkout',
    signInOption: 'Already have an account?',
    signInButton: 'Sign In',
    continueAsGuest: 'Continue as Guest',
    guestInfo: {
      title: 'Contact Information',
      email: 'Email Address',
      name: 'Full Name',
      phone: 'Phone Number (Optional)'
    },
    shipping: {
      title: 'Shipping Address',
      address: 'Address',
      city: 'City',
      state: 'State',
      pincode: 'Pincode',
      country: 'Country'
    },
    payment: {
      title: 'Payment Method',
      cardNumber: 'Card Number',
      expiryDate: 'Expiry Date',
      cvv: 'CVV',
      nameOnCard: 'Name on Card'
    },
    orderSummary: 'Order Summary',
    placeOrder: 'Place Order',
    processing: 'Processing...'
  },

  // Orders
  orders: {
    title: 'My Orders',
    noOrders: 'No orders found',
    orderNumber: 'Order #{{number}}',
    orderDate: 'Order Date',
    status: 'Status',
    total: 'Total',
    viewDetails: 'View Details',
    trackOrder: 'Track Order',
    reorder: 'Reorder',
    cancelOrder: 'Cancel Order',
    returnOrder: 'Return Order',
    statuses: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned'
    }
  },

  // Search
  search: {
    placeholder: 'Search products, pages...',
    noResults: 'No results found',
    suggestions: 'Suggestions',
    recentSearches: 'Recent Searches',
    popularSearches: 'Popular Searches',
    searchFor: 'Search for "{{query}}"',
    pages: 'Pages',
    products: 'Products'
  },

  // Footer
  footer: {
    quickLinks: 'Quick Links',
    customerService: 'Customer Service',
    followUs: 'Follow Us',
    newsletter: {
      title: 'Newsletter',
      subtitle: 'Subscribe to get updates on new arrivals and offers',
      placeholder: 'Enter your email',
      subscribe: 'Subscribe',
      success: 'Successfully subscribed!',
      error: 'Failed to subscribe. Please try again.'
    },
    copyright: '© {{year}} FICI. All rights reserved.'
  },

  // Error messages
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    notFound: 'Page not found',
    unauthorized: 'You are not authorized to access this page',
    forbidden: 'Access denied',
    serverError: 'Server error. Please try again later.',
    validation: 'Please check your input and try again'
  },

  // Success messages
  success: {
    itemAdded: 'Item added to cart',
    orderPlaced: 'Order placed successfully',
    profileUpdated: 'Profile updated successfully',
    addressSaved: 'Address saved successfully',
    subscribed: 'Successfully subscribed to newsletter'
  },

  // Accessibility
  a11y: {
    skipToContent: 'Skip to main content',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    searchButton: 'Search',
    cartButton: 'View cart',
    userMenu: 'User menu',
    productImage: 'Product image',
    loading: 'Loading content',
    error: 'Error occurred'
  }
};

// Type for string keys (for TypeScript support)
export type StringKey = keyof typeof strings;

// Helper function to get nested string values
export const getString = (key: string, params?: Record<string, any>): string => {
  const keys = key.split('.');
  let value: any = strings;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value !== 'string') {
    console.warn(`String key "${key}" not found`);
    return key;
  }
  
  // Simple parameter replacement (for future i18n library integration)
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match: string, param: string) => {
      return params[param] || match;
    });
  }
  
  return value;
};

// Export individual sections for easier imports
export const {
  common,
  nav,
  auth,
  products,
  cart,
  checkout,
  orders,
  search,
  footer,
  errors,
  success,
  a11y
} = strings;

import { Category, Product, Voucher, Reward } from '../types';

export const DEMO_CATEGORIES: Category[] = [
  { id: 'cat_coffee', name: 'Coffee', icon: 'coffee', description: 'Fresh handcrafted espresso blends and specialty brews', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400', displayOrder: 1, active: true },
  { id: 'cat_non_coffee', name: 'Non-Coffee', icon: 'cup-soda', description: 'Artisanal chocolate, matcha, and refreshing refreshments', image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400', displayOrder: 2, active: true },
  { id: 'cat_food', name: 'Food & Pastries', icon: 'croissant', description: 'Freshly baked pastries, croissants, and gourmet muffins', image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&q=80&w=400', displayOrder: 3, active: true },
  { id: 'cat_specials', name: 'Signature Specials', icon: 'sparkles', description: 'Barista signature seasonal specials and desserts', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=400', displayOrder: 4, active: true },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod_choco_lava',
    name: 'Choco Lava',
    category: 'Non-Coffee',
    description: 'Decadent iced dark chocolate blend layered with creamy milk and rich chocolate crunch drizzle.',
    price: 120,
    cost: 50,
    available: true,
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400',
    stockTracking: true,
    stockQuantity: 85,
    minStock: 15,
    sizes: [
      { name: 'Regular (16oz)', priceAdjustment: 0 },
      { name: 'Large (22oz)', priceAdjustment: 20 }
    ],
    addOns: [
      { name: 'Whipped Cream', price: 20 },
      { name: 'Extra Chocolate Shot', price: 25 },
      { name: 'Coffee Jelly', price: 15 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_banana_muffin',
    name: 'Banana muffin',
    category: 'Food & Pastries',
    description: 'Freshly baked artisanal banana muffin topped with roasted banana slice and warm spices.',
    price: 50,
    cost: 20,
    available: true,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&q=80&w=400',
    stockTracking: true,
    stockQuantity: 40,
    minStock: 10,
    sizes: [
      { name: 'Standard Piece', priceAdjustment: 0 }
    ],
    addOns: [
      { name: 'Warm Butter', price: 10 },
      { name: 'Nutella Drizzle', price: 20 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_spanish_latte',
    name: 'Spanish Latte',
    category: 'Coffee',
    description: 'Espresso with textured milk and sweet condensed milk for a silky smooth finish.',
    price: 140,
    cost: 55,
    available: true,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=400',
    stockTracking: true,
    stockQuantity: 120,
    minStock: 20,
    sizes: [
      { name: 'Regular (16oz)', priceAdjustment: 0 },
      { name: 'Large (22oz)', priceAdjustment: 25 }
    ],
    addOns: [
      { name: 'Extra Espresso Shot', price: 30 },
      { name: 'Oat Milk Sub', price: 35 },
      { name: 'Caramel Drizzle', price: 15 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_caramel_macchiato',
    name: 'Caramel Macchiato',
    category: 'Coffee',
    description: 'Freshly steamed milk with vanilla-flavored syrup marked with espresso and topped with caramel drizzle.',
    price: 150,
    cost: 60,
    available: true,
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&q=80&w=400',
    stockTracking: true,
    stockQuantity: 95,
    minStock: 15,
    sizes: [
      { name: 'Regular (16oz)', priceAdjustment: 0 },
      { name: 'Large (22oz)', priceAdjustment: 25 }
    ],
    addOns: [
      { name: 'Extra Caramel', price: 20 },
      { name: 'Whipped Cream', price: 20 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_matcha_latte',
    name: 'Uji Matcha Latte',
    category: 'Non-Coffee',
    description: 'Premium ceremonial grade Japanese matcha whisked with fresh creamy milk.',
    price: 135,
    cost: 55,
    available: true,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400',
    stockTracking: true,
    stockQuantity: 60,
    minStock: 10,
    sizes: [
      { name: 'Regular (16oz)', priceAdjustment: 0 },
      { name: 'Large (22oz)', priceAdjustment: 20 }
    ],
    addOns: [
      { name: 'Vanilla Syrup', price: 15 },
      { name: 'Soy Milk Sub', price: 30 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEMO_VOUCHERS: Voucher[] = [
  {
    id: 'vouch_welcome10',
    code: 'WELCOME10',
    name: 'Welcome Voucher',
    description: '10% discount on entire first order',
    discountType: 'percentage',
    discountValue: 10,
    minPurchase: 100,
    maxDiscount: 50,
    active: true,
    usageLimit: 1000,
    usageCount: 14,
    expirationDate: '2027-12-31'
  }
];

export const DEMO_REWARDS: Reward[] = [
  {
    id: 'rew_free_cookie',
    name: 'Free Artisanal Cookie',
    description: 'Redeem for 1 freshly baked cookie with any drink',
    pointsRequired: 50,
    rewardType: 'free_item',
    rewardValue: 0,
    freeItemName: 'Artisanal Cookie',
    active: true
  }
];




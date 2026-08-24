import React from 'react';
import {
  Coffee,
  CupSoda,
  Croissant,
  Cake,
  Cookie,
  Sandwich,
  Pizza,
  UtensilsCrossed,
  Utensils,
  Soup,
  Flame,
  Sparkles,
  IceCream,
  Apple,
  Salad,
  Beef,
  EggFried,
  Popcorn,
  Candy,
  Milk,
  Citrus,
  Wine,
  GlassWater,
  Layers,
  LucideProps
} from 'lucide-react';

export interface FoodIconOption {
  id: string;
  label: string;
  category: 'beverages' | 'bakery' | 'meals' | 'desserts' | 'snacks' | 'specials';
  IconComponent: React.ComponentType<LucideProps>;
}

export const FOOD_ICON_OPTIONS: FoodIconOption[] = [
  // Beverages
  { id: 'coffee', label: 'Coffee & Espresso', category: 'beverages', IconComponent: Coffee },
  { id: 'cup-soda', label: 'Cold Drinks / Soda', category: 'beverages', IconComponent: CupSoda },
  { id: 'glass-water', label: 'Water & Refreshers', category: 'beverages', IconComponent: GlassWater },
  { id: 'milk', label: 'Milk & Teas', category: 'beverages', IconComponent: Milk },
  { id: 'citrus', label: 'Fruit Juices', category: 'beverages', IconComponent: Citrus },
  { id: 'wine', label: 'Craft Brews / Wine', category: 'beverages', IconComponent: Wine },

  // Bakery & Bread
  { id: 'croissant', label: 'Croissants & Pastries', category: 'bakery', IconComponent: Croissant },
  { id: 'sandwich', label: 'Sandwiches & Toasts', category: 'bakery', IconComponent: Sandwich },
  { id: 'cookie', label: 'Cookies & Biscuits', category: 'bakery', IconComponent: Cookie },
  { id: 'cake', label: 'Cakes & Slices', category: 'bakery', IconComponent: Cake },

  // Meals & Mains
  { id: 'utensils', label: 'Food & Meals', category: 'meals', IconComponent: UtensilsCrossed },
  { id: 'pizza', label: 'Pizza & Savory', category: 'meals', IconComponent: Pizza },
  { id: 'beef', label: 'Meat & Mains', category: 'meals', IconComponent: Beef },
  { id: 'egg-fried', label: 'Breakfast & Eggs', category: 'meals', IconComponent: EggFried },
  { id: 'soup', label: 'Soups & Bowls', category: 'meals', IconComponent: Soup },
  { id: 'salad', label: 'Salads & Healthy', category: 'meals', IconComponent: Salad },

  // Desserts & Sweets
  { id: 'ice-cream', label: 'Ice Cream & Shakes', category: 'desserts', IconComponent: IceCream },
  { id: 'candy', label: 'Candy & Sweets', category: 'desserts', IconComponent: Candy },
  { id: 'apple', label: 'Fruits & Berries', category: 'desserts', IconComponent: Apple },

  // Snacks & Specials
  { id: 'popcorn', label: 'Snacks & Bites', category: 'snacks', IconComponent: Popcorn },
  { id: 'sparkles', label: 'Signature Specials', category: 'specials', IconComponent: Sparkles },
  { id: 'flame', label: 'Hot & Spicy Specials', category: 'specials', IconComponent: Flame },
  { id: 'layers', label: 'All Menu / Combos', category: 'specials', IconComponent: Layers },
];

export const getCategoryIconComponent = (iconId?: string, categoryName?: string): React.ComponentType<LucideProps> => {
  if (iconId) {
    const found = FOOD_ICON_OPTIONS.find(opt => opt.id === iconId);
    if (found) return found.IconComponent;
  }

  if (categoryName) {
    const name = categoryName.toLowerCase();
    if (name.includes('coffee') || name.includes('espresso') || name.includes('latte') || name.includes('brew')) {
      return Coffee;
    }
    if (name.includes('non-coffee') || name.includes('beverage') || name.includes('tea') || name.includes('juice') || name.includes('soda') || name.includes('drink')) {
      return CupSoda;
    }
    if (name.includes('croissant') || name.includes('pastry') || name.includes('pastries') || name.includes('bakery') || name.includes('bread') || name.includes('muffin')) {
      return Croissant;
    }
    if (name.includes('cake') || name.includes('dessert') || name.includes('sweet')) {
      return Cake;
    }
    if (name.includes('sandwich') || name.includes('burger') || name.includes('toast') || name.includes('panini')) {
      return Sandwich;
    }
    if (name.includes('cookie') || name.includes('biscuit')) {
      return Cookie;
    }
    if (name.includes('pizza')) {
      return Pizza;
    }
    if (name.includes('ice cream') || name.includes('shake') || name.includes('gelato') || name.includes('frappe')) {
      return IceCream;
    }
    if (name.includes('soup') || name.includes('bowl')) {
      return Soup;
    }
    if (name.includes('salad') || name.includes('healthy') || name.includes('greens')) {
      return Salad;
    }
    if (name.includes('breakfast') || name.includes('egg') || name.includes('brunch')) {
      return EggFried;
    }
    if (name.includes('special') || name.includes('signature') || name.includes('best') || name.includes('featured')) {
      return Sparkles;
    }
    if (name.includes('snack') || name.includes('finger') || name.includes('bites')) {
      return Popcorn;
    }
    if (name.includes('food') || name.includes('meal') || name.includes('dine') || name.includes('dish')) {
      return UtensilsCrossed;
    }
  }

  return Utensils;
};

interface CategoryIconProps extends LucideProps {
  iconId?: string;
  categoryName?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconId, categoryName, ...props }) => {
  const IconComp = getCategoryIconComponent(iconId, categoryName);
  return <IconComp {...props} />;
};

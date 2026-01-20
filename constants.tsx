
import React from 'react';
import {
  Utensils,
  Home,
  ShoppingBag,
  Ticket,
  Bus,
  Plane,
  User as UserIcon
} from 'lucide-react';
import { Category } from './types';

export const EMOJIS = ['😎', '🎨', '🚀', '⚡', '🌟', '🔥', '💎', '🎯', '🌈', '✨', '🎭', '🎪', '🎸', '🎮', '🏆'];

export const CURRENCIES = [
  { symbol: '₹', name: 'INR' },
  { symbol: '$', name: 'USD' },
  { symbol: '€', name: 'EUR' },
  { symbol: '£', name: 'GBP' },
  { symbol: '¥', name: 'JPY' },
  { symbol: 'AED', name: 'AED' }
];

export const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  [Category.RESTAURANT]: <Utensils className="w-5 h-5" />,
  [Category.ACCOMMODATION]: <Home className="w-5 h-5" />,
  [Category.FOOD]: <ShoppingBag className="w-5 h-5" />,
  [Category.EVENTS]: <Ticket className="w-5 h-5" />,
  [Category.CABS_BUS]: <Bus className="w-5 h-5" />,
  [Category.FLIGHT_TRAINS]: <Plane className="w-5 h-5" />,
  [Category.PERSONAL]: <UserIcon className="w-5 h-5" />,
};

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.RESTAURANT]: '#FF6B6B',
  [Category.ACCOMMODATION]: '#4D96FF',
  [Category.FOOD]: '#6BCB77',
  [Category.EVENTS]: '#FFD93D',
  [Category.CABS_BUS]: '#6C5CE7',
  [Category.FLIGHT_TRAINS]: '#00CEC9',
  [Category.PERSONAL]: '#A29BFE',
};

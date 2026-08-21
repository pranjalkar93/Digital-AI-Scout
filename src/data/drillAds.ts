import { DrillCategory } from '../types';

export interface DrillAd {
  id: string;
  drillCategory: DrillCategory | 'DEFAULT';
  categoryLabel: string;
  brandName: string;
  brandLogo: string;
  productTitle: string;
  tagline: string;
  description: string;
  sponsoredImage: string;
  ctaText: string;
  badge: string;
  price: string;
  originalPrice: string;
  rating: number;
  reviewsCount: number;
  highlightSpecs: string[];
}

export const DRILL_TARGETED_ADS: Record<string, DrillAd> = {
  JUGGLING: {
    id: 'ad-juggling-puma',
    drillCategory: 'JUGGLING',
    categoryLabel: 'Aerial Touch & Juggling',
    brandName: 'PUMA Football',
    brandLogo: '⚡',
    productTitle: 'PUMA Future Ultimate Touch Training Ball & Micro-Grip Socks',
    tagline: 'Official Aeroflow Juggling & Ball Control Gear',
    description: 'Engineered with 32-panel micro-textured grip casing for maximum aerial friction during high-rep juggling trials.',
    sponsoredImage: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?auto=format&fit=crop&q=80&w=800',
    ctaText: 'Shop Juggling Gear - 25% OFF',
    badge: 'DRILL SPONSOR',
    price: '₹1,499',
    originalPrice: '₹1,999',
    rating: 4.9,
    reviewsCount: 1280,
    highlightSpecs: ['High-frictional micro-pimple grip', 'Retains 99.4% shape integrity', 'Approved for Gali & Ground trials']
  },
  BALL_CONTROL: {
    id: 'ad-control-adidas',
    drillCategory: 'BALL_CONTROL',
    categoryLabel: 'First Touch & Control',
    brandName: 'Adidas Football',
    brandLogo: '👟',
    productTitle: 'Adidas Predator Precision Touch Turf Boots & Agility Mat',
    tagline: 'Official First-Touch Precision Equipment',
    description: 'High-density rubber Demonskin strike zone designed to cushion high-impact aerial passes in tight Gali environments.',
    sponsoredImage: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800',
    ctaText: 'Get Precision Boots',
    badge: 'DRILL SPONSOR',
    price: '₹3,299',
    originalPrice: '₹4,499',
    rating: 4.8,
    reviewsCount: 890,
    highlightSpecs: ['Cushioned ball-absorption upper', 'Multi-ground studs', 'Zero-slip heel counter']
  },
  SPRINT: {
    id: 'ad-sprint-nike',
    drillCategory: 'SPRINT',
    categoryLabel: 'Velocity & Acceleration',
    brandName: 'Nike Performance',
    brandLogo: '🏃‍♂️',
    productTitle: 'Nike Mercurial Vapor Speed Cleats & Laser Timing Gate',
    tagline: 'Official 0-20m Stride Velocity Kit',
    description: 'Carbon-fiber speed plate for explosive zero-delay takeoff in 20-meter straight line speed sprint trials.',
    sponsoredImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    ctaText: 'Explore Velocity Gear',
    badge: 'DRILL SPONSOR',
    price: '₹4,199',
    originalPrice: '₹5,299',
    rating: 4.9,
    reviewsCount: 2150,
    highlightSpecs: ['Ultra-lightweight 165g carbon chassis', 'High-traction sprint stud array', 'Laser gate sync enabled']
  },
  AGILITY: {
    id: 'ad-agility-decathlon',
    drillCategory: 'AGILITY',
    categoryLabel: 'Rapid Footwork & Deceleration',
    brandName: 'Kipsta Decathlon',
    brandLogo: '📐',
    productTitle: 'Kipsta Modular 4m Agility Ladder & Fast-Response Cones',
    tagline: 'Official Agility & Lateral Recovery Equipment',
    description: 'Flexible non-slip flat rungs designed for rapid direction changes and 180° deceleration trials.',
    sponsoredImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
    ctaText: 'Shop Agility Pack',
    badge: 'DRILL SPONSOR',
    price: '₹799',
    originalPrice: '₹1,199',
    rating: 4.7,
    reviewsCount: 1640,
    highlightSpecs: ['Anti-skid Gali floor grip', 'Heavy-duty weather-proof flat rungs', 'Includes mesh carry bag']
  },
  WEAK_FOOT: {
    id: 'ad-weakfoot-nivia',
    drillCategory: 'WEAK_FOOT',
    categoryLabel: 'Weak Foot & Dual Precision',
    brandName: 'Nivia Sports',
    brandLogo: '⚽',
    productTitle: 'Nivia Dual-Pass Rebounder Board & Target Wall',
    tagline: 'Official Dual-Foot Balance & Rebound Trainer',
    description: 'Adjustable angle high-rebound wall to build equal technique, velocity, and touch on both left and right feet.',
    sponsoredImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
    ctaText: 'Get Rebounder Board',
    badge: 'DRILL SPONSOR',
    price: '₹2,499',
    originalPrice: '₹3,299',
    rating: 4.8,
    reviewsCount: 750,
    highlightSpecs: ['Dual-angle return trajectories', 'Compact foldable frame for balconies/gallies', 'High impact polypropylene']
  },
  PASSING: {
    id: 'ad-passing-cosco',
    drillCategory: 'PASSING',
    categoryLabel: 'Passing Accuracy & Reception',
    brandName: 'COSCO India',
    brandLogo: '🎯',
    productTitle: 'COSCO Precision Target Passing Arches (Set of 4)',
    tagline: 'Official Ground & Wall Passing Accuracy Kit',
    description: 'Weighted ground targets designed to measure pass accuracy, weight of pass, and immediate second-touch reception.',
    sponsoredImage: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800',
    ctaText: 'Buy Passing Targets',
    badge: 'DRILL SPONSOR',
    price: '₹999',
    originalPrice: '₹1,499',
    rating: 4.6,
    reviewsCount: 520,
    highlightSpecs: ['Hi-vis neon orange frames', 'Works on turf, concrete & grass', 'Wind resistant weighted feet']
  },
  SHOOTING: {
    id: 'ad-shooting-kipsta',
    drillCategory: 'SHOOTING',
    categoryLabel: 'Striking Power & Top-Corner Precision',
    brandName: 'Kipsta Striker Series',
    brandLogo: '🔥',
    productTitle: 'Kipsta Top-Corner Goal Target Sheet & Power Cleats',
    tagline: 'Official Shooting Accuracy & Power Training Kit',
    description: 'Precision top-corner hole target sheet to evaluate striking power, ball curve, and placement accuracy.',
    sponsoredImage: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800',
    ctaText: 'Shop Striker Gear',
    badge: 'DRILL SPONSOR',
    price: '₹1,899',
    originalPrice: '₹2,499',
    rating: 4.9,
    reviewsCount: 1410,
    highlightSpecs: ['Top 90° corner pockets', 'Easy strap attachment to any crossbar', 'High-speed ball rebound mesh']
  },
  DRIBBLING: {
    id: 'ad-dribbling-puma',
    drillCategory: 'DRIBBLING',
    categoryLabel: 'Close Control & Dynamic Dribbling',
    brandName: 'PUMA Future Control',
    brandLogo: '⚡',
    productTitle: 'PUMA Dynamic Slalom Cones & Light-Up Agility Markers',
    tagline: 'Official Close-Control Dribbling Kit',
    description: 'Flexible dome cones for high-speed slalom dribbling trials in tight spaces.',
    sponsoredImage: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=800',
    ctaText: 'Shop Dribbling Cones',
    badge: 'DRILL SPONSOR',
    price: '₹649',
    originalPrice: '₹899',
    rating: 4.8,
    reviewsCount: 980,
    highlightSpecs: ['Unbreakable soft vinyl', 'Compact stackable setup', 'Bright high-contrast visual colors']
  }
};

export function getAdForDrillCategory(category?: string): DrillAd {
  if (category && DRILL_TARGETED_ADS[category]) {
    return DRILL_TARGETED_ADS[category];
  }
  return DRILL_TARGETED_ADS.JUGGLING;
}

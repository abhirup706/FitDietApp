import { GroceryCategory } from '../types';

export interface CategoryConfig {
  icon: string;
  color: string;
  label: string;
}

export const categoryConfig: Record<GroceryCategory, CategoryConfig> = {
  produce: {
    icon: 'leaf',
    color: '#4CAF50',
    label: 'Produce',
  },
  dairy: {
    icon: 'cheese',
    color: '#FFC107',
    label: 'Dairy',
  },
  meat: {
    icon: 'food-steak',
    color: '#D32F2F',
    label: 'Meat',
  },
  seafood: {
    icon: 'fish',
    color: '#2196F3',
    label: 'Seafood',
  },
  bakery: {
    icon: 'bread-slice',
    color: '#8D6E63',
    label: 'Bakery',
  },
  frozen: {
    icon: 'snowflake',
    color: '#00BCD4',
    label: 'Frozen',
  },
  pantry: {
    icon: 'package-variant',
    color: '#795548',
    label: 'Pantry',
  },
  beverages: {
    icon: 'cup',
    color: '#9C27B0',
    label: 'Beverages',
  },
  snacks: {
    icon: 'cookie',
    color: '#FF9800',
    label: 'Snacks',
  },
  other: {
    icon: 'cart',
    color: '#607D8B',
    label: 'Other',
  },
};

const categoryKeywords: Record<GroceryCategory, string[]> = {
  produce: [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry',
    'raspberry', 'mango', 'pineapple', 'watermelon', 'melon', 'peach', 'pear', 'plum',
    'cherry', 'avocado', 'tomato', 'lettuce', 'spinach', 'kale', 'carrot', 'celery',
    'broccoli', 'cauliflower', 'pepper', 'onion', 'garlic', 'potato', 'sweet potato',
    'cucumber', 'zucchini', 'squash', 'mushroom', 'corn', 'bean', 'pea', 'asparagus',
    'eggplant', 'cabbage', 'brussels', 'beet', 'radish', 'ginger', 'fruit', 'vegetable',
    'salad', 'herbs', 'basil', 'cilantro', 'parsley', 'mint', 'greens',
  ],
  dairy: [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese',
    'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'ricotta', 'brie',
    'gouda', 'swiss', 'egg', 'eggs', 'half and half', 'whipped cream', 'heavy cream',
  ],
  meat: [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'bacon', 'sausage', 'ham',
    'steak', 'ground beef', 'ground turkey', 'ground pork', 'ribs', 'chop', 'roast',
    'tenderloin', 'breast', 'thigh', 'wing', 'drumstick', 'meatball', 'hot dog',
    'deli', 'salami', 'pepperoni', 'prosciutto',
  ],
  seafood: [
    'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'trout', 'bass', 'snapper',
    'shrimp', 'prawn', 'lobster', 'crab', 'scallop', 'mussel', 'clam', 'oyster',
    'squid', 'calamari', 'octopus', 'anchovy', 'sardine', 'mackerel', 'swordfish',
  ],
  bakery: [
    'bread', 'bagel', 'croissant', 'muffin', 'roll', 'bun', 'baguette', 'tortilla',
    'pita', 'naan', 'flatbread', 'sourdough', 'rye', 'whole wheat', 'white bread',
    'donut', 'pastry', 'danish', 'cake', 'pie', 'cookie', 'brownie', 'cupcake',
  ],
  frozen: [
    'frozen', 'ice cream', 'popsicle', 'frozen pizza', 'frozen vegetable', 'frozen fruit',
    'frozen dinner', 'frozen meal', 'frozen fish', 'frozen chicken', 'frozen waffle',
    'frozen fries', 'ice', 'gelato', 'sorbet', 'frozen yogurt',
  ],
  pantry: [
    'rice', 'pasta', 'noodle', 'cereal', 'oatmeal', 'flour', 'sugar', 'salt', 'pepper',
    'oil', 'olive oil', 'vinegar', 'sauce', 'ketchup', 'mustard', 'mayo', 'mayonnaise',
    'soy sauce', 'hot sauce', 'spice', 'seasoning', 'canned', 'can of', 'bean', 'soup',
    'broth', 'stock', 'peanut butter', 'jelly', 'jam', 'honey', 'syrup', 'nut', 'almond',
    'walnut', 'cashew', 'seed', 'quinoa', 'couscous', 'lentil', 'chickpea',
  ],
  beverages: [
    'water', 'juice', 'soda', 'pop', 'cola', 'sprite', 'coffee', 'tea', 'latte',
    'espresso', 'beer', 'wine', 'liquor', 'vodka', 'whiskey', 'rum', 'gin', 'tequila',
    'champagne', 'smoothie', 'shake', 'milk', 'almond milk', 'oat milk', 'soy milk',
    'coconut water', 'energy drink', 'sports drink', 'lemonade', 'iced tea',
  ],
  snacks: [
    'chip', 'chips', 'cracker', 'pretzel', 'popcorn', 'nut', 'trail mix', 'granola bar',
    'protein bar', 'candy', 'chocolate', 'gummy', 'cookie', 'biscuit', 'snack bar',
    'dried fruit', 'jerky', 'cheese puff', 'tortilla chip', 'salsa', 'dip', 'hummus',
    'guacamole',
  ],
  other: [],
};

export function autoDetectCategory(itemName: string): GroceryCategory {
  const lowerName = itemName.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'other') continue;

    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return category as GroceryCategory;
      }
    }
  }

  return 'other';
}

export const allCategories: GroceryCategory[] = [
  'produce',
  'dairy',
  'meat',
  'seafood',
  'bakery',
  'frozen',
  'pantry',
  'beverages',
  'snacks',
  'other',
];

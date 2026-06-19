export const PRODUCTS = [
  // Eggs
  { id: 1,  name: 'White Egg',               pack: '1 Pc',   price: 6.50,  stock: 100, category: 'eggs',      emoji: '🥚' },
  { id: 2,  name: 'Country Egg',             pack: '1 Pc',   price: 12,    stock: 100, category: 'eggs',      emoji: '🥚' },
  { id: 3,  name: 'Country Egg Box',         pack: '1 Pc',   price: 100,   stock: 50,  category: 'box',       emoji: '📦' },
  { id: 4,  name: 'Double Yellow Egg',       pack: '1 Pc',   price: 8.50,  stock: 100, category: 'eggs',      emoji: '🥚' },
  { id: 5,  name: 'Kada Egg (Box)',          pack: '1 Pc',   price: 60,    stock: 30,  category: 'box',       emoji: '📦' },
  { id: 6,  name: 'Bullet Egg',             pack: '1 Pc',   price: 6,     stock: 100, category: 'eggs',      emoji: '🥚' },
  { id: 7,  name: 'Duck Egg',               pack: '1 Pc',   price: 15,    stock: 50,  category: 'eggs',      emoji: '🥚' },
  { id: 8,  name: 'Damage Egg',             pack: '1 Pc',   price: 4,     stock: 50,  category: 'eggs',      emoji: '🥚' },
 
  // Masalas
  { id: 9,  name: 'Aachi Chicken 65 Masala',    pack: '1 Pc',   price: 10,  stock: 100, category: 'masala', emoji: '🌶️' },
  { id: 10, name: 'Aachi Chicken Masala',        pack: '1 Pc',   price: 10,  stock: 100, category: 'masala', emoji: '🌶️' },
  { id: 11, name: 'Aachi Chilli Powder',         pack: '1 Pc',   price: 10,  stock: 100, category: 'masala', emoji: '🌶️' },
  { id: 12, name: 'Aachi Fish Curry Masala',     pack: '1 Pc',   price: 10,  stock: 100, category: 'masala', emoji: '🌶️' },
  { id: 13, name: 'Aachi Fish Fry Masala',       pack: '1 Pc',   price: 10,  stock: 100, category: 'masala', emoji: '🌶️' },
  { id: 14, name: 'Aachi Garam Masala',          pack: '1 Pc',   price: 10,  stock: 100, category: 'masala', emoji: '🌶️' },
  { id: 15, name: 'Aachi Kolambu Masala (50g)',  pack: '1 Pc',   price: 20,  stock: 100, category: 'masala', emoji: '🌶️' },
  { id: 16, name: 'Aachi Mutton Masala',         pack: '1 Pc',   price: 10,  stock: 100, category: 'masala', emoji: '🌶️' },
  { id: 17, name: 'Chicken 65 Masala 100g',      pack: '1 Pc',   price: 35,  stock: 50,  category: 'masala', emoji: '🌶️' },
  { id: 18, name: 'Chicken Masala 100g',         pack: '1 Pc',   price: 70,  stock: 50,  category: 'masala', emoji: '🌶️' },
 
  // Batter
  { id: 19, name: 'Balaji Batter 1kg',      pack: '1 Pc',   price: 45,  stock: 50,  category: 'batter',    emoji: '🫙' },
  { id: 20, name: 'Balaji Batter 1/2kg',    pack: '1 Pc',   price: 23,  stock: 50,  category: 'batter',    emoji: '🫙' },
 
  // Box / Tray
  { id: 21, name: 'Egg Box 12',             pack: '1 Pc',   price: 70,  stock: 100, category: 'box',       emoji: '📦' },
  { id: 22, name: 'Egg Box 6',              pack: '1 Pc',   price: 50,  stock: 100, category: 'box',       emoji: '📦' },
  { id: 23, name: 'Egg Plastic Tray 12',    pack: '1 Pc',   price: 12,  stock: 100, category: 'box',       emoji: '📦' },
  { id: 24, name: 'Egg Plastic Tray 6',     pack: '1 Pc',   price: 6,   stock: 100, category: 'box',       emoji: '📦' },
  { id: 25, name: 'Egg Cardboard Tray',     pack: '1 Pc',   price: 5,   stock: 200, category: 'box',       emoji: '📦' },
  { id: 26, name: 'Egg Plastic Tray',       pack: '1 Pc',   price: 50,  stock: 100, category: 'box',       emoji: '📦' },
 
  // Household
  { id: 27, name: 'Floor Mat Big',          pack: '1 Pc',   price: 180, stock: 20,  category: 'household', emoji: '🪣' },
  { id: 28, name: 'Floor Mat Small',        pack: '1 Pc',   price: 60,  stock: 30,  category: 'household', emoji: '🪣' },
 
  // Other Items
  { id: 29, name: 'Garlic',                 pack: '1 kg',   price: 150, stock: 30,  category: 'other',     emoji: '🧄' },
  { id: 30, name: 'Hatsun Cup Curd 200g',   pack: '1 Pc',   price: 25,  stock: 50,  category: 'other',     emoji: '🥛' },
  { id: 31, name: 'Hatsun Curd 110g',       pack: '1 Pc',   price: 10,  stock: 50,  category: 'other',     emoji: '🥛' },
  { id: 32, name: 'Country Sugar',          pack: '1 kg',   price: 70,  stock: 40,  category: 'other',     emoji: '🍬' },
  { id: 33, name: 'Coconut',               pack: '1 kg',   price: 70,  stock: 30,  category: 'other',     emoji: '🥥' },
]
 
export const CATEGORIES = [
  { id: 'all',       label: 'All' },
  { id: 'eggs',      label: 'Eggs' },
  { id: 'masala',    label: 'Masala' },
  { id: 'batter',    label: 'Batter' },
  { id: 'box',       label: 'Box' },
  { id: 'household', label: 'House Hold' },
  { id: 'other',     label: 'Other Items' },
]

export const CUSTOMERS = []


export const EXPENSES = []

export const SALES_HISTORY = []

export const SUPPLIERS = []

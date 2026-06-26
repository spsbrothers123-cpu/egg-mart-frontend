// src/data/products.js
// All 33 products for Egg Mart Purchase Module

export const PURCHASE_PRODUCTS = [
  // ── EGGS ─────────────────────────────────────────────────────────────────
  { id: 1,  name: "Farm Fresh Eggs (Tray 30)",    category: "Eggs",        unit: "Tray",  defaultPrice: 180, taxRate: 0 },
  { id: 2,  name: "Farm Fresh Eggs (Pack 6)",     category: "Eggs",        unit: "Pack",  defaultPrice: 38,  taxRate: 0 },
  { id: 3,  name: "Farm Fresh Eggs (Pack 12)",    category: "Eggs",        unit: "Pack",  defaultPrice: 72,  taxRate: 0 },
  { id: 4,  name: "Country / Desi Eggs (Tray 30)",category: "Eggs",       unit: "Tray",  defaultPrice: 270, taxRate: 0 },
  { id: 5,  name: "Country / Desi Eggs (Pack 6)", category: "Eggs",        unit: "Pack",  defaultPrice: 55,  taxRate: 0 },
  { id: 6,  name: "Organic Free-Range Eggs (Doz)",category: "Eggs",        unit: "Dozen", defaultPrice: 120, taxRate: 0 },
  { id: 7,  name: "Brown Eggs (Tray 30)",          category: "Eggs",       unit: "Tray",  defaultPrice: 210, taxRate: 0 },
  { id: 8,  name: "Brown Eggs (Pack 6)",           category: "Eggs",       unit: "Pack",  defaultPrice: 44,  taxRate: 0 },
  { id: 9,  name: "Omega-3 Enriched Eggs (Pack 6)",category: "Eggs",       unit: "Pack",  defaultPrice: 65,  taxRate: 0 },
  { id: 10, name: "Quail Eggs (Pack 20)",          category: "Eggs",       unit: "Pack",  defaultPrice: 90,  taxRate: 0 },
  { id: 11, name: "Duck Eggs (Pack 6)",            category: "Eggs",       unit: "Pack",  defaultPrice: 80,  taxRate: 0 },
  { id: 12, name: "Jumbo Eggs (Tray 30)",          category: "Eggs",       unit: "Tray",  defaultPrice: 220, taxRate: 0 },
  { id: 13, name: "Medium Eggs (Tray 30)",         category: "Eggs",       unit: "Tray",  defaultPrice: 165, taxRate: 0 },

  // ── EGG PRODUCTS ─────────────────────────────────────────────────────────
  { id: 14, name: "Boiled Eggs (Pack 6)",          category: "Egg Products", unit: "Pack", defaultPrice: 50,  taxRate: 5 },
  { id: 15, name: "Pickled Eggs (Jar 12)",         category: "Egg Products", unit: "Jar",  defaultPrice: 130, taxRate: 5 },
  { id: 16, name: "Liquid Whole Egg (1 Litre)",   category: "Egg Products", unit: "Litre",defaultPrice: 95,  taxRate: 5 },
  { id: 17, name: "Egg White Liquid (500 ml)",    category: "Egg Products", unit: "Bottle",defaultPrice: 80, taxRate: 5 },
  { id: 18, name: "Egg Yolk Liquid (500 ml)",     category: "Egg Products", unit: "Bottle",defaultPrice: 75, taxRate: 5 },
  { id: 19, name: "Egg Powder (200 g)",            category: "Egg Products", unit: "Pack", defaultPrice: 160, taxRate: 5 },
  { id: 20, name: "Pasteurised Eggs (Dozen)",      category: "Egg Products", unit: "Dozen",defaultPrice: 130, taxRate: 5 },

  // ── DAIRY ────────────────────────────────────────────────────────────────
  { id: 21, name: "Full Cream Milk (1 Litre)",    category: "Dairy",       unit: "Litre", defaultPrice: 68,  taxRate: 0 },
  { id: 22, name: "Toned Milk (500 ml)",           category: "Dairy",       unit: "Pouch", defaultPrice: 30,  taxRate: 0 },
  { id: 23, name: "Butter (500 g)",                category: "Dairy",       unit: "Pack",  defaultPrice: 240, taxRate: 5 },
  { id: 24, name: "Paneer (200 g)",                category: "Dairy",       unit: "Pack",  defaultPrice: 90,  taxRate: 0 },
  { id: 25, name: "Curd / Yoghurt (400 g)",        category: "Dairy",       unit: "Cup",   defaultPrice: 45,  taxRate: 0 },
  { id: 26, name: "Cheese Slices (200 g)",         category: "Dairy",       unit: "Pack",  defaultPrice: 120, taxRate: 12 },

  // ── FEEDS & SUPPLEMENTS ──────────────────────────────────────────────────
  { id: 27, name: "Poultry Layer Feed (25 kg)",   category: "Feed",        unit: "Bag",   defaultPrice: 950, taxRate: 0 },
  { id: 28, name: "Poultry Starter Feed (25 kg)", category: "Feed",        unit: "Bag",   defaultPrice: 900, taxRate: 0 },
  { id: 29, name: "Calcium Supplement (1 kg)",    category: "Feed",        unit: "Pack",  defaultPrice: 110, taxRate: 5 },
  { id: 30, name: "Vitamin Premix (500 g)",        category: "Feed",        unit: "Pack",  defaultPrice: 180, taxRate: 5 },

  // ── PACKAGING ────────────────────────────────────────────────────────────
  { id: 31, name: "Egg Carton (Pack of 50)",      category: "Packaging",   unit: "Pack",  defaultPrice: 200, taxRate: 18 },
  { id: 32, name: "Egg Tray (Pack of 20)",        category: "Packaging",   unit: "Pack",  defaultPrice: 150, taxRate: 18 },
  { id: 33, name: "Bubble Wrap Roll (50 m)",      category: "Packaging",   unit: "Roll",  defaultPrice: 280, taxRate: 18 },
];

export const PRODUCT_CATEGORIES = [
  "All",
  "Eggs",
  "Egg Products",
  "Dairy",
  "Feed",
  "Packaging",
];

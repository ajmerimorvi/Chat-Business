export interface CategoryDefinition {
  id: string;
  name: string;
  icon?: string;
  subcategories: string[];
}

export const MASTER_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'furniture',
    name: 'Furniture',
    subcategories: ['Home Furniture', 'Office Furniture', 'Handcrafted & Teak', 'Modular Sofas', 'Outdoor Furniture'],
  },
  {
    id: 'mattress',
    name: 'Mattress',
    subcategories: ['Orthopedic Mattress', 'Memory Foam', 'Coir & Spring', 'Pillows & Protectors'],
  },
  {
    id: 'furnishing',
    name: 'Furnishing',
    subcategories: ['Curtains & Drapes', 'Upholstery Fabric', 'Bedsheets & Linen', 'Carpets & Rugs'],
  },
  {
    id: 'home_decor',
    name: 'Home Decor',
    subcategories: ['Wall Decor & Art', 'Lighting & Lamps', 'Artifacts & Vases', 'Clocks & Mirrors'],
  },
  {
    id: 'interior_designer',
    name: 'Interior Designer',
    subcategories: ['Residential Interior', 'Commercial & Retail', 'Turnkey Contracting', 'Architectural Consultation'],
  },
  {
    id: 'hardware',
    name: 'Hardware',
    subcategories: ['Architectural Hardware', 'Kitchen Fittings & Channels', 'Plywood & Laminates', 'Tools & Fasteners'],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    subcategories: ['Home Appliances', 'Air Conditioning & Coolers', 'Smart TVs & Audio', 'Mobile & Computing'],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    subcategories: ['Family Dining', 'Pure Veg / Kathiyawadi', 'Fast Food & Cafe', 'Catering & Banquet'],
  },
  {
    id: 'hotel',
    name: 'Hotel',
    subcategories: ['Business Hotel', 'Resort & Stay', 'Guest House', 'Boutique Lodge'],
  },
  {
    id: 'retail',
    name: 'Retail',
    subcategories: ['Apparel & Fashion', 'Jewelry & Ornaments', 'Footwear & Bags', 'Grocery & Supermarket'],
  },
  {
    id: 'services',
    name: 'Services',
    subcategories: ['Appliance Repair', 'Carpentry & Polishing', 'Plumbing & Electrical', 'Painting & Waterproofing'],
  },
  {
    id: 'other',
    name: 'Other',
    subcategories: ['General Enterprise', 'Trading & Distribution', 'Workshop'],
  },
];

export function getCategoryNames(): string[] {
  return MASTER_CATEGORIES.map((c) => c.name);
}

export function getSubcategoriesForCategory(categoryName: string): string[] {
  const match = MASTER_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
  );
  return match ? match.subcategories : [];
}

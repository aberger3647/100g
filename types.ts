export interface Product {
  barcode: string;
  product_name: string;
  macros: {
    protein: number;
    carbohydrates: number;
    fat: number;
    energy_kcal: number;
  };
  pricePer100g?: number;
}

export interface Comparison {
  id: string;
  items: Product[];
  date: string;
}

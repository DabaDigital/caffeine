import { products, type Product } from "@/data/menu";

// Display values transcribed from the supplied design; confirm before publishing.
export const designMenu: Product[] = products.map((product, index) => ({
  ...product,
  price: [45, 55, 25][index],
  name: index === 2 ? "Hot Americano" : product.name,
  description: [
    "Rich espresso, fresh milk and a touch of caramel.",
    "Our most loved crêpe, loaded with Lotus.",
    "Pure coffee, pure focus.",
  ][index],
  ...(index === 2
    ? {
        detail:
          "Rich espresso and hot water. A beautifully simple coffee, made for taking a moment.",
      }
    : {}),
}));

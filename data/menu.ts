import { assets } from "./brand";
export type Product = {
  id: string;
  name: string;
  category: "Coffee" | "Crêpes";
  description: string;
  detail: string;
  image: string;
  price: number | null;
  note: string;
};
export const products: Product[] = [
  {
    id: "iced-caramel",
    name: "Iced Caramel Latte",
    category: "Coffee",
    description: "Rich espresso. Silky milk. A caramel finish.",
    detail:
      "Coffee, milk and caramel over ice. A little sweetness for your daily coffee ritual.",
    image: assets.iced,
    price: null,
    note: "A little pick-me-up",
  },
  {
    id: "lotus-crepe",
    name: "Lotus Crêpe",
    category: "Crêpes",
    description: "Golden crêpe. Lotus crunch. Pure indulgence.",
    detail:
      "A crêpe topped with Lotus biscuit crumbs and a generous sweet drizzle. Best enjoyed with your favorite coffee.",
    image: assets.crepe,
    price: null,
    note: "Made for sweet moments",
  },
  {
    id: "hot-coffee",
    name: "Hot Coffee",
    category: "Coffee",
    description: "Your coffee ritual, in our signature cup.",
    detail:
      "A warm cup, a familiar aroma, a moment to slow down. Ask our team in the café about the coffees available today.",
    image: assets.hot,
    price: null,
    note: "The everyday essential",
  },
];

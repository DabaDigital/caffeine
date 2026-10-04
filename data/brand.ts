export const assets = {
  hero: "/assets/hero-caffeine.webp",
  iced: "/assets/iced-caramel.webp",
  crepe: "/assets/lotus-crepe.webp",
  hot: "/assets/hot-coffee.webp",
  storefrontCutout: "/assets/storefront-cutout.webp",
  storefront: "/assets/storefront.webp",
  hand: "/assets/hand-coffee.webp",
  texture: "/assets/coffee-texture.webp",
  logo: "/assets/logo.webp",
  mark: "/assets/brand-mark.png",
} as const;
export const social = {
  instagram: "https://www.instagram.com/caffeinemaarif/",
  handle: "@caffeinemaarif",
  tiktok: null,
};
export const location = {
  name: "Caffeine Maarif",
  neighborhood: "Maarif",
  city: "Casablanca",
  address: null as string | null,
  phone: null as string | null,
  hours: null as string | null,
  googleMapsUrl: null as string | null,
};
// An explicitly labeled search, not an unverified place pin or address.
export const mapsSearchUrl =
  "https://www.google.com/maps/search/?api=1&query=Caffeine%20Maarif%20Casablanca";
export const navigation = [
  { label: "Menu", href: "#menu" },
  { label: "Our Story", href: "#story" },
  { label: "Location", href: "#location" },
];

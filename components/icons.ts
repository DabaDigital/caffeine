import {
  CakeSlice,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Facebook,
  Ghost,
  Globe,
  IceCreamCone,
  Instagram,
  Leaf,
  Linkedin,
  Mail,
  MessageCircle,
  Music2,
  Phone,
  Pin,
  Sandwich,
  Snowflake,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIcon, ContactType, SocialPlatform } from "@/lib/site";

export const categoryIconComponents: Record<CategoryIcon, LucideIcon> = {
  coffee: Coffee,
  iced: Snowflake,
  tea: Leaf,
  sweet: Cookie,
  cake: CakeSlice,
  pastry: Croissant,
  juice: CupSoda,
  food: Sandwich,
  dessert: IceCreamCone,
};

// Lucide has no TikTok or Snapchat marks; these are the closest neutral icons.
export const socialIconComponents: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  x: Twitter,
  youtube: Youtube,
  snapchat: Ghost,
  linkedin: Linkedin,
  pinterest: Pin,
  website: Globe,
};

export const contactIconComponents: Record<ContactType, LucideIcon> = {
  phone: Phone,
  email: Mail,
  whatsapp: MessageCircle,
};

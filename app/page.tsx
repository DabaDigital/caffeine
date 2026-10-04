import CaffeineExperience from "@/components/experience/CaffeineExperience";
import { getSiteContent } from "@/lib/content";

// Served from cache; dashboard edits refresh it immediately, and changes made
// directly in Supabase appear within a minute.
export const revalidate = 60;

export default async function Home() {
  const content = await getSiteContent();
  return <CaffeineExperience content={content} />;
}

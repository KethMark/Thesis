import { HeroSectionComponent } from "@/components/landingpage/hero-section";
import { StickyNavbarComponent } from "@/components/landingpage/sticky-navbar";

export default function Home() {
  return (
    <div>
      <StickyNavbarComponent/>
      <HeroSectionComponent/>
    </div>
  );
}

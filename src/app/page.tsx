import { Hero } from '@/components/sections/Hero';
import { Features } from '@/components/sections/Features';
import { Games } from '@/components/sections/Games';
import { FAQ } from '@/components/sections/FAQ';
import { CTA } from '@/components/sections/CTA';

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Games />
      <FAQ />
      <CTA />
    </>
  );
}

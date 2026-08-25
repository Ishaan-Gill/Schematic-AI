import "@/components/landing/landing.css";
import { AskQuestions } from "@/components/landing/ask-questions";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";
import { Trust } from "@/components/landing/trust";

export default function LandingPage() {
  return (
    <main id="top" className="launch-site min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <AskQuestions />
      <Trust />
      <FAQ />
      <Footer />
    </main>
  );
}

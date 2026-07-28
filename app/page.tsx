import { AskQuestions } from "@/components/landing/ask-questions";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";
import { Trust } from "@/components/landing/trust";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <AskQuestions />
      <HowItWorks />
      <Trust />
      <FAQ />
      <Footer />
    </main>
  );
}

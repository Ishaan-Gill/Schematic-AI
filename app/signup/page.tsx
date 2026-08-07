import type { Metadata } from "next";
import SignupPage from "@/components/auth/SignupPage";

export const metadata: Metadata = {
  title: "Create Account | Schematic AI",
  description:
    "Create a free Schematic AI account and start analyzing your CSV and Excel data with AI.",
};

export default function SignupRoute() {
  return <SignupPage />;
}
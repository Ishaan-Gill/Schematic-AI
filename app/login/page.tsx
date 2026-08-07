import type { Metadata } from "next";
import LoginPage from "@/components/auth/LoginPage";

export const metadata: Metadata = {
  title: "Log in | Schematic AI",
  description:
    "Log in to Schematic AI to access your workspace and analyze your business data.",
};

export default function LoginRoute() {
  return <LoginPage />;
}
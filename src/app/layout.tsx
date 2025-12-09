
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
export const metadata: Metadata = { title: "Dangercord", description: "Database" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return ( <html lang="fr"><body className="min-h-screen pt-16"><Navbar />{children}</body></html> );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Anatomy of Becoming",
  description: "An interactive AI constellation portfolio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
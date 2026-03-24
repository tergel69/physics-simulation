import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Black Hole Simulation",
  description: "Interactive black hole, gravity, and quantum visualization playground.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

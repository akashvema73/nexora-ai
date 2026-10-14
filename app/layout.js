import "./globals.css";

export const metadata = {
  title: "Nexora AI",
  description: "Coding aur study ke liye aapka AI saathi",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

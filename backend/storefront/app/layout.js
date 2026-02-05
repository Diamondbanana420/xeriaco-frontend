import './globals.css';

export const metadata = {
  title: 'XeriaCO — Curated Premium Lifestyle',
  description: 'Discover curated products tailored to your taste. Premium lifestyle essentials with AI-powered personalization.',
  keywords: 'premium lifestyle, curated products, trending, XeriaCO, dropshipping, AI shopping',
  openGraph: {
    title: 'XeriaCO — Curated Premium Lifestyle',
    description: 'Premium lifestyle essentials curated by AI.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-xeria-bg text-xeria-text antialiased">
        {children}
      </body>
    </html>
  );
}

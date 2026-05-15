import './globals.css';

export const metadata = {
  title: 'BLE Scanner Pro',
  description: 'Professional BLE Scanner, Analyzer & Sniffer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

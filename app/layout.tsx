import "./globals.css";

export const metadata = {
  title: "FormFlow",
  description: "Form automation for Google Workspace teams"
};

export default function RootLayout({ children }: { children: unknown }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}

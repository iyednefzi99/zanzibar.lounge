import "@/app/globals.css";

import { fontVariables } from "@/lib/fonts";

export const metadata = {
  title: "Reservation",
  robots: { index: false },
};

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={fontVariables}>
      <body className="min-h-dvh bg-deep font-sans text-shell antialiased">
        {children}
      </body>
    </html>
  );
}

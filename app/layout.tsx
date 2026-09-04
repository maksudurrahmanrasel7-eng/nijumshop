import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="flex justify-center gap-6 p-4 bg-white shadow-md font-bold text-blue-600">
          
        </nav>
        {children}
      </body>
    </html>
  );
}
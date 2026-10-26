import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Applebay Institute | Academic Portal",
  description: "Academic, Attendance & Fee Ledger Management System",
  icons: {
    icon: "/applebay-logo.svg",
    shortcut: "/applebay-logo.svg",
    apple: "/applebay-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans">
        {/* Top Navigation Bar with Logo */}
        <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo + Institute Name */}
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center ring-1 ring-blue-500/30 group-hover:ring-blue-400 transition-all shadow-md">
                <Image
                  src="/applebay-logo.svg"
                  alt="Applebay Institute Logo"
                  width={36}
                  height={36}
                  priority
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-bold tracking-tight text-lg text-white group-hover:text-blue-300 transition-colors">
                    Applebay Institute
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                    Academic Portal
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 -mt-0.5 hidden sm:inline">
                  Higher Education &amp; Vocational Training
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-1 sm:space-x-2 text-sm font-medium">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/courses"
                className="px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Courses
              </Link>
              <Link
                href="/register"
                className="px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Registration
              </Link>
              <Link
                href="/students"
                className="px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Student Directory
              </Link>
              <Link
                href="/attendance"
                className="px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Attendance
              </Link>
              <Link
                href="/payments"
                className="px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Payments
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 mt-auto">
          <div className="flex items-center justify-center space-x-2">
            <Image
              src="/applebay-logo.svg"
              alt="Logo"
              width={16}
              height={16}
              className="opacity-70"
            />
            <span>Applebay Institute Academic System &copy; 2026. Layered Architecture Full-Stack Solution.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

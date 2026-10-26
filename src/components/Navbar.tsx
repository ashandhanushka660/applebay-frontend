"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navs = [
    { label: "Dashboard", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "New Registration", href: "/register" },
    { label: "Student Directory", href: "/students" },
    { label: "Attendance", href: "/attendance" },
    { label: "Payments", href: "/payments" },
  ];

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-xl tracking-tight text-blue-400">
              Applebay Institute
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Academic Portal
            </span>
          </div>
          <div className="flex space-x-1 sm:space-x-4">
            {navs.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

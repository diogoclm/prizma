import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { LogoutButton } from "@/components/ui/LogoutButton";

const navItems = [
  { href: "/dashboard", label: "Visão Geral" },
  { href: "/dashboard/hoteleiro", label: "Hoteleiro" },
  { href: "/dashboard/incorporacao", label: "Incorporação" },
  { href: "/dashboard/terrenos", label: "Terrenos" },
  { href: "/dashboard/projetos", label: "Projetos" },
  { href: "/dashboard/importar", label: "Importar Planilha" },
];

const societarioItems = [
  { href: "/dashboard/acionistas", label: "Acionistas" },
  { href: "/dashboard/administracao", label: "Administração" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-prizma-50 text-prizma-700 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-prizma-300 flex flex-col">
        <div className="p-5 border-b border-prizma-300">
          <Wordmark size="sm" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded text-prizma-600 hover:bg-prizma-100 hover:text-prizma-900 transition-colors text-sm"
            >
              {item.label}
            </Link>
          ))}

          <p className="text-[10px] uppercase tracking-wide text-prizma-400 font-medium px-3 pt-4 pb-1">
            Societário
          </p>
          {societarioItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded text-prizma-600 hover:bg-prizma-100 hover:text-prizma-900 transition-colors text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-prizma-300">
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

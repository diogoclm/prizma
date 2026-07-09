import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { roleFromMetadata } from "@/lib/auth/roles";

const navItems = [
  { href: "/dashboard", label: "Visão Geral" },
  { href: "/dashboard/hoteleiro", label: "Hoteleiro" },
  { href: "/dashboard/incorporacao", label: "Incorporação" },
  { href: "/dashboard/terrenos", label: "Terrenos" },
  { href: "/dashboard/projetos", label: "Projetos" },
  { href: "/dashboard/importar", label: "Importar Planilha" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = roleFromMetadata(user?.app_metadata);
  const isAdmin = role === "ADMIN";

  const societarioItems = [
    { href: "/dashboard/acionistas", label: "Acionistas" },
    { href: "/dashboard/administracao", label: "Administração" },
    ...(isAdmin ? [{ href: "/dashboard/pl", label: "Participação de Lucros" }] : []),
  ];

  return (
    <div className="min-h-screen bg-prizma-50 text-prizma-700 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-prizma-300 flex flex-col">
        <div className="p-5 border-b border-prizma-300">
          <Wordmark size="sm" />
          <p className="text-[10px] text-prizma-400 mt-1">Versão 1.0</p>
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

          {isAdmin && (
            <>
              <p className="text-[10px] uppercase tracking-wide text-prizma-400 font-medium px-3 pt-4 pb-1">
                Configuração
              </p>
              <Link
                href="/dashboard/usuarios"
                className="block px-3 py-2 rounded text-prizma-600 hover:bg-prizma-100 hover:text-prizma-900 transition-colors text-sm"
              >
                Usuários
              </Link>
            </>
          )}
        </nav>
        <div className="p-3 border-t border-prizma-300">
          {user?.email && (
            <p className="text-[10px] text-prizma-400 px-3 pb-2 truncate">
              {user.email} · {isAdmin ? "Admin" : "Analista"}
            </p>
          )}
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fmtDate } from "@/lib/format";

interface AppUser {
  id: string;
  email: string | undefined;
  role: "ADMIN" | "ANALISTA";
  createdAt: string;
  lastSignInAt: string | null;
}

const ROLE_OPTIONS = [
  { value: "ANALISTA", label: "Analista" },
  { value: "ADMIN", label: "Administrador" },
] as const;

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "ANALISTA">("ANALISTA");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/users")
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) { window.location.href = "/login"; return; }
          throw new Error(`Erro ao carregar (${r.status})`);
        }
        const d: AppUser[] = await r.json();
        setUsers(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Falha ao carregar usuários.");
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    if (!res.ok) {
      const data = await res.json();
      const zodErrors = data.error?.fieldErrors
        ? Object.values(data.error.fieldErrors as Record<string, string[]>).flat().join(", ")
        : null;
      setFormError(zodErrors ?? (typeof data.error === "string" ? data.error : "Erro ao criar usuário"));
      setSubmitting(false);
      return;
    }

    setEmail("");
    setPassword("");
    setRole("ANALISTA");
    setShowForm(false);
    setSubmitting(false);
    load();
  }

  async function handleRoleChange(user: AppUser, newRole: "ADMIN" | "ANALISTA") {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(typeof data.error === "string" ? data.error : "Erro ao alterar papel");
    }
    load();
  }

  async function handleDelete(user: AppUser) {
    if (!confirm(`Remover o usuário ${user.email}? Ele perderá o acesso imediatamente.`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(typeof data.error === "string" ? data.error : "Erro ao remover usuário");
    }
    load();
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard" className="text-xs text-prizma-400 hover:text-prizma-600 mb-2 block">
        ← Voltar ao dashboard
      </Link>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-prizma-900">Usuários</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 bg-prizma-800 hover:bg-prizma-900 rounded-lg text-xs text-white transition-colors"
        >
          {showForm ? "Cancelar" : "+ Novo usuário"}
        </button>
      </div>
      <p className="text-prizma-400 text-sm mt-1 mb-6">
        Administrador vê e edita tudo, inclusive esta tela. Analista lança dados de projetos e
        acionistas, sem acesso à Participação de Lucros.
      </p>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4 mb-6">
          <h3 className="text-sm font-semibold text-prizma-600">Novo usuário</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-prizma-400 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nome@empresa.com"
                className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-prizma-400 mb-1">Senha inicial</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="mínimo 8 caracteres"
                className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-prizma-400 mb-1">Papel</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          {formError && <p className="text-negative text-xs">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
          >
            {submitting ? "Criando..." : "Criar usuário"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-prizma-400">Carregando...</p>
      ) : error ? (
        <p className="text-negative text-sm">{error}</p>
      ) : (
        <div className="rounded-xl border border-prizma-300 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white text-prizma-400 text-xs">
              <tr>
                <th className="px-4 py-2 text-left">E-mail</th>
                <th className="px-4 py-2 text-left">Papel</th>
                <th className="px-4 py-2 text-left">Criado em</th>
                <th className="px-4 py-2 text-left">Último acesso</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-prizma-200">
              {users.map((u) => (
                <tr key={u.id} className="bg-white hover:bg-prizma-50">
                  <td className="px-4 py-2 text-prizma-800 font-medium">{u.email}</td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value as "ADMIN" | "ANALISTA")}
                      className="bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-prizma-500">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-2 text-prizma-500">{u.lastSignInAt ? fmtDate(u.lastSignInAt) : "nunca"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDelete(u)}
                      className="text-negative hover:opacity-80 text-xs"
                    >
                      remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

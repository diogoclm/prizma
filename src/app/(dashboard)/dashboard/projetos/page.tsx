"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/format";

interface ProjectListItem {
  id: string;
  name: string;
  branch: "HOTELEIRO" | "IMOBILIARIO";
  stage: string;
  ownershipPct: number;
}

export default function ProjetosPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/imobiliario").then((r) => r.json()),
      fetch("/api/hoteleiro").then((r) => r.json()),
    ]).then(([spes, hotel]) => {
      const speItems: ProjectListItem[] = spes.map((p: { projectId: string; name: string; stage: string; ownershipPct: number }) => ({
        id: p.projectId,
        name: p.name,
        branch: "IMOBILIARIO" as const,
        stage: p.stage,
        ownershipPct: p.ownershipPct,
      }));
      const hotelItem: ProjectListItem[] = hotel.error
        ? []
        : [{ id: hotel.projectId, name: hotel.name, branch: "HOTELEIRO" as const, stage: "OPERACAO_CONTINUA", ownershipPct: hotel.ownershipPct }];
      setProjects([...hotelItem, ...speItems]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-prizma-900">Todos os Projetos</h1>
      <p className="text-prizma-400 text-sm mt-1 mb-6">{projects.length} projetos cadastrados</p>

      {loading ? (
        <p className="text-prizma-400">Carregando...</p>
      ) : (
        <div className="rounded-xl border border-prizma-300 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white text-prizma-400 text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Projeto</th>
                <th className="px-4 py-3 text-left">Ramo</th>
                <th className="px-4 py-3 text-left">Estágio</th>
                <th className="px-4 py-3 text-right">Ownership</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-prizma-200">
              {projects.map((p) => (
                <tr key={p.id} className="bg-prizma-50 hover:bg-white">
                  <td className="px-4 py-3 text-prizma-800">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={p.branch === "HOTELEIRO" ? "text-prizma-700" : "text-prizma-700"}>
                      {p.branch === "HOTELEIRO" ? "Hoteleiro" : "Incorporação"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STAGE_COLORS[p.stage] ?? ""}`}>
                      {STAGE_LABELS[p.stage] ?? p.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-prizma-400">{p.ownershipPct}%</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={p.branch === "HOTELEIRO" ? "/dashboard/hoteleiro" : `/dashboard/projetos/${p.id}`}
                      className="text-prizma-400 hover:text-prizma-300 text-xs"
                    >
                      Ver detalhes →
                    </Link>
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

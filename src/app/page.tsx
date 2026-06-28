import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { GeometricMark } from "@/components/ui/GeometricMark";

export default function Home() {
  return (
    <main className="min-h-screen bg-prizma-50 text-prizma-700 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
      <GeometricMark
        variant="octahedron"
        className="absolute -top-10 -right-10 w-72 h-72 text-prizma-300 opacity-40"
      />
      <GeometricMark
        variant="prism"
        className="absolute -bottom-16 -left-16 w-72 h-72 text-prizma-300 opacity-30"
      />

      <div className="text-center relative z-10">
        <Wordmark size="lg" showTagline className="text-center" />
        <p className="text-prizma-500 mt-4">Sistema de Análise de TIR</p>
      </div>
      <div className="flex gap-4 relative z-10">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-prizma-900 text-white rounded-lg hover:bg-prizma-700 transition-colors font-medium"
        >
          Abrir Dashboard
        </Link>
      </div>
    </main>
  );
}

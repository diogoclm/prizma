import { PrismaClient, Branch, ProjectStage } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Prizma database...");

  // ── Hoteleiro ──────────────────────────────────────────────────────────────
  const hotel = await prisma.project.upsert({
    where: { id: "hotel-001" },
    update: { name: "Nannai Milagres" },
    create: {
      id: "hotel-001",
      name: "Nannai Milagres",
      branch: Branch.HOTELEIRO,
      stage: ProjectStage.OPERACAO_CONTINUA,
      ownershipPct: 50,
      description: "Participação de 50% em operação hoteleira contínua. Lançamentos já refletem a fração da Prizma.",
    },
  });

  // ── Imobiliário — obras entregues ──────────────────────────────────────────
  const spe1 = await prisma.project.upsert({
    where: { id: "spe-001" },
    update: {},
    create: {
      id: "spe-001",
      name: "SPE Residencial Alpha",
      branch: Branch.IMOBILIARIO,
      stage: ProjectStage.ENTREGUE,
      ownershipPct: 100,
      description: "Obra residencial entregue. TIR realizada disponível.",
      deliveryDate: new Date("2023-06-01"),
    },
  });

  const spe2 = await prisma.project.upsert({
    where: { id: "spe-002" },
    update: {},
    create: {
      id: "spe-002",
      name: "SPE Comercial Beta",
      branch: Branch.IMOBILIARIO,
      stage: ProjectStage.ENTREGUE,
      ownershipPct: 100,
      description: "Obra comercial entregue. TIR realizada disponível.",
      deliveryDate: new Date("2024-03-01"),
    },
  });

  // ── Imobiliário — em construção ────────────────────────────────────────────
  const spe3 = await prisma.project.upsert({
    where: { id: "spe-003" },
    update: {},
    create: {
      id: "spe-003",
      name: "SPE Residencial Gamma",
      branch: Branch.IMOBILIARIO,
      stage: ProjectStage.CONSTRUCAO,
      ownershipPct: 100,
      description: "Em construção. TIR parcial realizada + reprojeção.",
      launchDate: new Date("2022-10-01"),
      deliveryDate: new Date("2026-12-01"),
    },
  });

  // ── Imobiliário — para lançamento ──────────────────────────────────────────
  const spe4 = await prisma.project.upsert({
    where: { id: "spe-004" },
    update: {},
    create: {
      id: "spe-004",
      name: "SPE Delta (Pré-lançamento)",
      branch: Branch.IMOBILIARIO,
      stage: ProjectStage.LANCAMENTO,
      ownershipPct: 100,
      description: "Lançamento previsto em breve. Baseline congelado.",
      launchDate: new Date("2025-09-01"),
    },
  });

  // ── Imobiliário — landbanking (4 terrenos) ─────────────────────────────────
  const landbank = [
    { id: "lb-001", name: "Terreno Epsilon — Zona Norte" },
    { id: "lb-002", name: "Terreno Zeta — Litoral" },
    { id: "lb-003", name: "Terreno Eta — Centro Expandido" },
    { id: "lb-004", name: "Terreno Theta — Rodovia Sul" },
  ];

  for (const lb of landbank) {
    await prisma.project.upsert({
      where: { id: lb.id },
      update: {},
      create: {
        id: lb.id,
        name: lb.name,
        branch: Branch.IMOBILIARIO,
        stage: ProjectStage.LANDBANKING,
        ownershipPct: 100,
        description: "Terreno em landbanking. Apenas baseline (viabilidade).",
      },
    });
  }

  const counts = await prisma.project.groupBy({
    by: ["branch", "stage"],
    _count: true,
  });

  console.log("✅ Seed completo. Projetos criados:");
  console.table(counts.map((c) => ({ branch: c.branch, stage: c.stage, count: c._count })));
  console.log(`   Hotel: ${hotel.name} (${hotel.ownershipPct}%)`);
  console.log(`   SPEs imobiliárias: ${spe1.name}, ${spe2.name}, ${spe3.name}, ${spe4.name}`);
  console.log(`   Landbanking: ${landbank.map((l) => l.name).join(", ")}`);

  // ── Acionistas ──────────────────────────────────────────────────────────────
  const shareholders = [
    { id: "sh-jose-ricardo", name: "José Ricardo", adminPct: 0.25, order: 1 },
    { id: "sh-marina", name: "Marina", adminPct: 0.05, order: 2 },
    { id: "sh-priscila", name: "Priscila", adminPct: 0, order: 3 },
  ];

  for (const sh of shareholders) {
    await prisma.shareholder.upsert({
      where: { id: sh.id },
      update: { name: sh.name, adminPct: sh.adminPct, order: sh.order },
      create: sh,
    });
  }

  console.log(`   Acionistas: ${shareholders.map((s) => `${s.name} (${(s.adminPct * 100).toFixed(0)}%)`).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { describe, it, expect } from "vitest";
import { roleFromMetadata, requiredRoleFor, canAccess } from "../roles";

describe("roleFromMetadata", () => {
  it("retorna ADMIN quando app_metadata.role é ADMIN", () => {
    expect(roleFromMetadata({ role: "ADMIN" })).toBe("ADMIN");
  });

  it("retorna ANALISTA quando role é ANALISTA", () => {
    expect(roleFromMetadata({ role: "ANALISTA" })).toBe("ANALISTA");
  });

  it("nega por padrão: sem metadata ou sem role vira ANALISTA", () => {
    expect(roleFromMetadata(undefined)).toBe("ANALISTA");
    expect(roleFromMetadata(null)).toBe("ANALISTA");
    expect(roleFromMetadata({})).toBe("ANALISTA");
    expect(roleFromMetadata({ role: "qualquer-coisa" })).toBe("ANALISTA");
  });
});

describe("requiredRoleFor", () => {
  it("exige ADMIN para Participação de Lucros (página e API)", () => {
    expect(requiredRoleFor("/dashboard/pl")).toBe("ADMIN");
    expect(requiredRoleFor("/api/pl/years")).toBe("ADMIN");
    expect(requiredRoleFor("/api/pl/years/abc/projects/xyz")).toBe("ADMIN");
  });

  it("exige ADMIN para gestão de usuários (página e API)", () => {
    expect(requiredRoleFor("/dashboard/usuarios")).toBe("ADMIN");
    expect(requiredRoleFor("/api/users")).toBe("ADMIN");
    expect(requiredRoleFor("/api/users/abc-123")).toBe("ADMIN");
  });

  it("não exige papel para o resto do dashboard e das APIs", () => {
    expect(requiredRoleFor("/dashboard")).toBeNull();
    expect(requiredRoleFor("/dashboard/projetos")).toBeNull();
    expect(requiredRoleFor("/dashboard/acionistas")).toBeNull();
    expect(requiredRoleFor("/dashboard/administracao")).toBeNull();
    expect(requiredRoleFor("/api/projects")).toBeNull();
    expect(requiredRoleFor("/api/shareholders/abc/transactions")).toBeNull();
  });

  it("não confunde prefixos parecidos", () => {
    // "/api/pl" não pode capturar rotas que apenas começam com as mesmas letras
    expect(requiredRoleFor("/api/plantas")).toBeNull();
    expect(requiredRoleFor("/dashboard/plano")).toBeNull();
  });
});

describe("canAccess", () => {
  it("ADMIN acessa tudo", () => {
    expect(canAccess("ADMIN", "/dashboard/pl")).toBe(true);
    expect(canAccess("ADMIN", "/api/users")).toBe(true);
    expect(canAccess("ADMIN", "/dashboard/projetos")).toBe(true);
  });

  it("ANALISTA acessa projetos e acionistas, mas não PL nem usuários", () => {
    expect(canAccess("ANALISTA", "/dashboard/projetos")).toBe(true);
    expect(canAccess("ANALISTA", "/dashboard/acionistas")).toBe(true);
    expect(canAccess("ANALISTA", "/api/projects")).toBe(true);
    expect(canAccess("ANALISTA", "/dashboard/pl")).toBe(false);
    expect(canAccess("ANALISTA", "/api/pl/years")).toBe(false);
    expect(canAccess("ANALISTA", "/dashboard/usuarios")).toBe(false);
    expect(canAccess("ANALISTA", "/api/users")).toBe(false);
  });
});

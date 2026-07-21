import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hub Atlas",
    short_name: "Atlas",
    description:
      "CRM, pipeline, agendamentos e rotina da Atlas em um só lugar.",
    // abre direto no painel: quem instala o app é do time, não visitante
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // combinam com o tema escuro pra a tela de abertura não piscar branco
    background_color: "#0a0705",
    theme_color: "#0a0705",
    lang: "pt-BR",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // maskable tem margem extra: o Android recorta o ícone em formas
      // diferentes por fabricante, e sem isso o "A" ficaria cortado
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Rotina do dia", url: "/dashboard/routine" },
      { name: "Leads", url: "/dashboard/leads" },
      { name: "Agendamentos", url: "/dashboard/appointments" },
    ],
  };
}

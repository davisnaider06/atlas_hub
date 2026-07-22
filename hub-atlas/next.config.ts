import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Esconde o selo de dev do Next (o "Compiling..." que ficava por cima da UI).
  // Erros de compilação/runtime continuam aparecendo normalmente.
  devIndicators: false,
  experimental: {
    serverActions: {
      // O upload passa por server action, e o padrão de 1MB rejeitaria
      // qualquer proposta em PDF. Fica acima do limite de 20MB validado no
      // código, pra a mensagem de erro vir da aplicação e não do framework.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;

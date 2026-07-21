import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Esconde o selo de dev do Next (o "Compiling..." que ficava por cima da UI).
  // Erros de compilação/runtime continuam aparecendo normalmente.
  devIndicators: false,
};

export default nextConfig;

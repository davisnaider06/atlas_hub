import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { buttonClasses } from "@/components/ui/button";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight">Hub Atlas</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Plataforma que centraliza a operação da Atlas: CRM, agendamentos e documentos.
      </p>
      {userId ? (
        <Link href="/dashboard" className={buttonClasses("primary")}>
          Ir para o painel
        </Link>
      ) : (
        <div className="flex gap-4">
          <Link href="/sign-in" className={buttonClasses("primary")}>
            Entrar
          </Link>
          <Link href="/sign-up" className={buttonClasses("secondary")}>
            Criar conta
          </Link>
        </div>
      )}
    </div>
  );
}

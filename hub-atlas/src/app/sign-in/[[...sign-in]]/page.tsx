import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
      <Link href="/" className="mb-6 flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-fg">
          A
        </span>
        <span className="text-base font-semibold tracking-tight">Hub Atlas</span>
      </Link>

      <div className="glass-panel rounded-2xl p-2">
        <SignIn />
      </div>
    </div>
  );
}

import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-ink flex flex-col items-center justify-center px-4">
      {/* Brand mark */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-green mb-4">
          <span className="text-brand-cream font-display font-bold text-2xl">M</span>
        </div>
        <p className="text-brand-cream/60 text-sm tracking-widest uppercase">MarketLink</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-background rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold font-display mb-1">Welcome back</h1>
        <p className="text-base text-muted-foreground mb-8">Sign in to your account.</p>
        <LoginForm />
      </div>

      <p className="mt-8 text-brand-cream/50 text-base">
        First time?{" "}
        <Link href="/welcome" className="text-brand-copper underline underline-offset-2">
          Create account
        </Link>
      </p>
    </div>
  );
}

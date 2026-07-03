import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { opsLogin } from "./actions";

type OpsLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function OpsLoginPage({ searchParams }: OpsLoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-brand-ink flex flex-col items-center justify-center px-4">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-green mb-4">
          <span className="text-brand-cream font-display font-bold text-2xl">M</span>
        </div>
        <p className="text-brand-cream/60 text-sm tracking-widest uppercase">Capital Ops</p>
      </div>

      <div className="w-full max-w-sm bg-background rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold font-display mb-1">Back office sign in</h1>
        <p className="text-base text-muted-foreground mb-8">Staff access only.</p>

        <form action={opsLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive">Wrong username or password.</p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full bg-brand-green hover:bg-brand-green-light text-brand-cream"
          >
            Sign in
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Demo access: admin / admin
          </p>
        </form>
      </div>
    </div>
  );
}

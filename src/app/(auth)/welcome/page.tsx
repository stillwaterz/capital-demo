import { WelcomeForm } from "@/components/welcome-form";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-brand-ink flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-green mb-4">
            <span className="text-brand-cream font-display font-bold text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-bold font-display text-brand-cream mt-2">
            What should we call you?
          </h1>
          <p className="text-base text-brand-cream/60 mt-2">
            Just your first name is fine.
          </p>
        </div>
        <WelcomeForm />
      </div>
    </div>
  );
}

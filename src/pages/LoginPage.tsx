import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Welcome back</h1>
          <p className="text-sm text-primary-cyan">
            Sign in to access your Workspaces and documents.
          </p>
        </div>

        <form className="flex flex-col gap-5">
          <Input 
            id="email"
            type="email"
            label="Email address"
            placeholder="name@company.com"
            required
          />
          
          <Input 
            id="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            required
            rightIcon={<EyeIcon />}
          />

          <Button type="button" className="mt-2">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-primary-cyan mt-4">
          New to Folio?{" "}
          <a href="/register" className="font-semibold text-foreground hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
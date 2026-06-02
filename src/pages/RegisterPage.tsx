import { AuthLayout } from "../components/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";


const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Create your account</h1>
          <p className="text-sm text-primary-cyan">
            Join Folio to collaborate on your team's documents.
          </p>
        </div>

        <form className="flex flex-col gap-4">
          <Input 
            id="fullname"
            type="text"
            label="Full name"
            placeholder="e.g. John Doe"
            required
          />

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
            placeholder="Enter a password (min. 8 characters)"
            required
            rightIcon={<EyeIcon />}
          />

          <Input 
            id="confirm-password"
            type="password"
            label="Confirm password"
            placeholder="Confirm your password"
            required
            rightIcon={<EyeIcon />}
          />

          <div className="flex items-center gap-2 mt-1">
            <input 
              type="checkbox" 
              id="terms" 
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary" 
              required
            />
            <label htmlFor="terms" className="text-sm text-primary-cyan">
              I agree to all <a href="#" className="font-semibold text-foreground hover:underline">Terms of Service</a> and <a href="#" className="font-semibold text-foreground hover:underline">Privacy Policy</a>
            </label>
          </div>

          <Button type="button" className="mt-2">
            Sign up
          </Button>
        </form>

        <p className="text-center text-sm text-primary-cyan mt-2">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-foreground hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
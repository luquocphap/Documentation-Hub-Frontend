import { AuthLayout } from "../components/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { useState } from "react";

export default function RegisterPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

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
            type={isPasswordVisible ? "text" : "password"}
            label="Password"
            placeholder="Enter a password (min. 8 characters)"
            required
            rightIcon={<EyeIcon isVisible={isPasswordVisible} />}
            rightIconLabel={isPasswordVisible ? "Hide password" : "Show password"}
            onRightIconClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
          />

          <Input 
            id="confirm-password"
            type={isConfirmPasswordVisible ? "text" : "password"}
            label="Confirm password"
            placeholder="Confirm your password"
            required
            rightIcon={<EyeIcon isVisible={isConfirmPasswordVisible} />}
            rightIconLabel={isConfirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
            onRightIconClick={() => setIsConfirmPasswordVisible((isVisible) => !isVisible)}
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

import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { useState } from "react";


export default function LoginPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
            type={isPasswordVisible ? "text" : "password"}
            label="Password"
            placeholder="Enter your password"
            required
            rightIcon={<EyeIcon isVisible={isPasswordVisible} />}
            rightIconLabel={isPasswordVisible ? "Hide password" : "Show password"}
            onRightIconClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
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

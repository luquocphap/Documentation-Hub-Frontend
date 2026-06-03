import Header from "@/components/ui/Header";
import hero from "@/assets/images/verify-email-hero.png";
interface VerifyEmailPageProps {
  email?: string;
  onResend?: () => void;
}

export function VerifyEmailPage({
  email = "abc123@gmail.com",
  onResend,
}: VerifyEmailPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Header
        brandName="Folio"
      />

      <main className="flex flex-col items-center justify-center min-h-115 px-6 py-12">
        <div className="flex flex-col items-center text-center max-w-160">

          <div className="w-81.5 h-auto mb-7 object-center">
            <img src={hero} className="w-full h-full inset-0 object-cover" />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-2.5">
            Verify your email address
          </h1>

          <span className="text-base text-primary-cyan leading-relaxed mb-1.5">
            We've just sent a verification email to{" "}
            <strong className="text-foreground font-medium">{email}</strong>.
            Please check your inbox.
          </span>

          <p className="text-base text-primary-cyan mt-1">
            Didn't receive an email?{" "}
            <button
              onClick={onResend}
              className="bg-transparent border-none p-0 text-foreground font-medium text-sm font-body underline underline-offset-2 cursor-pointer hover:opacity-70 transition-opacity"
            >
              Resend Verification Link
            </button>
          </p>

        </div>
      </main>
    </div>
  );
}

export default VerifyEmailPage;
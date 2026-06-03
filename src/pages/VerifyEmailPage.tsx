import Header from "@/components/ui/Header";
import hero from "@/assets/images/verify-email-hero.png";
import VerifyNoti from "@/components/VerifyNoti";
interface VerifyEmailPageProps {
  email?: string;
  onResend: () => void;
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

      <VerifyNoti email={email} onResend={onResend} />
      
    </div>
  );
}

export default VerifyEmailPage;
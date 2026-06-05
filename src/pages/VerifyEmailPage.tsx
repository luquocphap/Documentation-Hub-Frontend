import Header from "@/components/ui/Header";
import VerifyNoti from "@/components/VerifyNoti";
interface VerifyEmailPageProps {
  email?: string;
//   onResend: () => void;
}

export function VerifyEmailPage({
  email = "abc123@gmail.com",
//   onResend,
}: VerifyEmailPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Header
        brandName="Folio"
        showSearch={false}
      />

      <VerifyNoti email={email} />
    </div>
  );
}

export default VerifyEmailPage;
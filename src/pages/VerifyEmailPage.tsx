import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/api/api";
import Header from "@/components/ui/Header";
import VerifyNoti from "@/components/VerifyNoti";
import { normalizeWorkspaceRedirect } from "@/lib/workspaceRedirect";
import { getBadRequestMessage } from "@/lib/apiValidation";

interface VerifyEmailPageProps {
  email?: string;
}

export function VerifyEmailPage({
  email,
}: VerifyEmailPageProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const state = location.state as {
    email?: string;
  } | null;
  const resolvedEmail = email || state?.email || "";
  const redirectTo = normalizeWorkspaceRedirect(
    searchParams.get("redirectTo")
  );

  const handleResendVerification = async () => {
    if (!resolvedEmail || isResending) {
      return;
    }

    setIsResending(true);

    try {
      await authApi.resendVerification({
        email: resolvedEmail,
        redirectTo,
      });
      toast.success("Verification email sent successfully.", {
        style: {
          backgroundColor: "bg-green-50",
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 500,
          fontSize: 'text-sm',
          letterSpacing: '0%',
          border: '1px solid bg-green-700',
        },
        classNames: {
          icon: 'text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5', 
        }
      });
    } catch (error) {
      const badRequestMessage = getBadRequestMessage(error);

      toast.error(
        badRequestMessage ||
        "Failed to resend verification email."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Header
        brandName="Folio"
        showSearch={false}
      />

      <VerifyNoti
        email={resolvedEmail || "your email address"}
        isResending={isResending}
        canResend={Boolean(resolvedEmail)}
        onResend={handleResendVerification}
      />
    </div>
  );
}

export default VerifyEmailPage;

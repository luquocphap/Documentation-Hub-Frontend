import axios from "axios";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/api";
import Header from "@/components/ui/Header";
import VerifySuccess from "@/components/VerifySuccess";
import { normalizeWorkspaceRedirect } from "@/lib/workspaceRedirect";
import { useAuthStore } from "@/stores/useAuthStore";

type Status = "loading" | "success" | "expired" | "error";

interface VerifySuccessPageProps {
  onVerify?: (token: string) => Promise<void>;
}

const verificationRequests = new Map<
  string,
  Promise<void>
>();

async function defaultVerify(token: string): Promise<void> {
  try {
    const response = await authApi.verifyEmail(token);

    if (response.statusCode !== 200) {
      if (response.statusCode === 410) {
        throw new Error("expired");
      }

      throw new Error("error");
    }
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 410
    ) {
      throw new Error("expired");
    }

    if (
      error instanceof Error &&
      error.message === "expired"
    ) {
      throw error;
    }

    throw new Error("error");
  }
}

function verifyEmailOnce(token: string): Promise<void> {
  const existingRequest = verificationRequests.get(token);

  if (existingRequest) {
    return existingRequest;
  }

  const request = defaultVerify(token);
  verificationRequests.set(token, request);
  return request;
}

export function VerifySuccessPage({
  onVerify,
}: VerifySuccessPageProps) {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const redirectTo = normalizeWorkspaceRedirect(
    searchParams.get("redirectTo")
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verify = onVerify ?? verifyEmailOnce;

    verify(token)
      .then(() => {
        login();
        setStatus("success");

        if (redirectTo) {
          navigate(redirectTo, {
            replace: true,
          });
        }
      })
      .catch((error: Error) => {
        setStatus(
          error.message === "expired"
            ? "expired"
            : "error"
        );
      });
  }, [
    token,
    onVerify,
    login,
    navigate,
    redirectTo,
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Header brandName="Folio" showSearch={false} />

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center text-center w-full max-w-100">
          {status === "loading" && (
            <>
              <div className="text-primary-cyan mb-6">
                <Loader2 className="animate-spin" />
              </div>
              <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-2.5">
                Verifying your email...
              </h1>
              <p className="text-sm text-primary-cyan leading-relaxed">
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {status === "success" && <VerifySuccess />}

          {status === "expired" && (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-2.5">
                Verification link expired
              </h1>
              <p className="text-sm text-primary-cyan leading-relaxed">
                Please request a new verification email and try again.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-2.5">
                Email verification failed
              </h1>
              <p className="text-sm text-primary-cyan leading-relaxed">
                The verification link is invalid or could not be processed.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default VerifySuccessPage;

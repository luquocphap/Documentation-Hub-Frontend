import { authApi } from "@/api/api";
import Header from "@/components/ui/Header";
import VerifySuccess from "@/components/VerifySuccess";
import { useAuthStore } from "@/stores/useAuthStore";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";


type Status = "loading" | "success" | "expired" | "error";

interface VerifySuccessPageProps {
  /** Override API call — dùng cho testing */
  onVerify?: (token: string) => Promise<void>;
  /** Redirect sau khi verify thành công (mặc định: /login) */
  redirectTo?: string;
}

async function defaultVerify(token: string): Promise<void> {
  const res = await authApi.verifyEmail(token);
  console.log({res})
  if (res.statusCode !== 200) {
    if (res.statusCode === 410) throw new Error("expired");
    throw new Error("error");
  }
}

export function VerifySuccessPage({
  onVerify,
}: VerifySuccessPageProps) {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");

  const login = useAuthStore((s) => s.login);
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verify = onVerify ?? defaultVerify;

    verify(token)
      .then(() => {
        setStatus("success");
        login();
      })
      .catch((err: Error) => {
        setStatus(err.message === "expired" ? "expired" : "error");
      });
  }, [token, onVerify]);


  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Header brandName="Folio" showSearch={false} />

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center text-center w-full max-w-100">

          {status === "loading" ? (
            <>
              <div className="text-primary-cyan mb-6">
                <Loader2 />
              </div>
              <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-2.5">
                Verifying your email…
              </h1>
              <p className="text-sm text-primary-cyan leading-relaxed">
                Please wait while we confirm your email address.
              </p>
            </>
          ) : (
            (() => {
              return (
                <VerifySuccess />
              );
            })()
          )}

        </div>
      </main>
    </div>
  );
}

export default VerifySuccessPage;
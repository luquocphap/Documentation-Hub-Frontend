import { authApi } from "@/api/api";
import Header from "@/components/ui/Header";
import VerifySuccess from "@/components/VerifySuccess";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";


type Status = "loading" | "success" | "expired" | "error";

interface VerifySuccessPageProps {
  /** Override API call — dùng cho testing */
  onVerify?: (token: string) => Promise<void>;
  /** Redirect sau khi verify thành công (mặc định: /login) */
  redirectTo?: string;
}


const STATUS_CONTENT: Record<
  Exclude<Status, "loading">,
  { icon: React.ReactNode; color: string; title: string; desc: string; action?: string }
> = {
  success: {
    icon: <CheckCircle />,
    color: "text-foreground",
    title: "Email verified successfully",
    desc: "Your account is now active. You can sign in and start using Folio.",
    action: "Go to sign in",
  },
  expired: {
    icon: <XCircle />,
    color: "text-primary-cyan",
    title: "Link has expired",
    desc: "This verification link is no longer valid. Request a new one and we'll send it right away.",
    action: "Resend verification link",
  },
  error: {
    icon: <XCircle />,
    color: "text-primary-cyan",
    title: "Something went wrong",
    desc: "This link may have already been used or is invalid. Try signing in — if your email is already verified, you're good to go.",
    action: "Go to sign in",
  },
};

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

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verify = onVerify ?? defaultVerify;

    verify(token)
      .then(() => setStatus("success"))
      .catch((err: Error) => {
        setStatus(err.message === "expired" ? "expired" : "error");
      });
  }, [token, onVerify]);

//   const handleAction = () => {
//     if (status === "expired") {
//       navigate("/register");
//     } else {
//       navigate(redirectTo);
//     }
//   };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Header brandName="Folio" />

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] px-6 py-12">
        <div className="flex flex-col items-center text-center w-full max-w-[400px]">

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
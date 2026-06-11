import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Header from "@/components/ui/Header";
import { Button } from "@/components/ui/Button";
import unauthorizedIllustration from "@/assets/images/401-illustration.png";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header không có thanh search */}
      <Header showSearch={false} />

      {/* Thẻ chính ở dưới */}
      <main className="flex-1 pt-16 flex flex-col items-center px-4">
        
        {/* Thẻ div con 640px, rounded-xl */}
        <div className="w-full max-w-160 rounded-xl flex flex-col items-center">
          
          {/* 1. Phần ảnh 300x300 */}
          <div className="w-75 h-75 shrink-0 flex items-center justify-center">
            <img 
              src={unauthorizedIllustration} 
              alt="403 Unauthorized" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* 2. Phần text (pb-5, gap-4) */}
          <div className="flex flex-col items-center text-center pb-5 gap-4">
            <h1 className="text-4xl font-semibold text-foreground">
              403
            </h1>
            <h2 className="text-lg font-medium text-foreground">
              Looks like you need access
            </h2>
            <p className="text-sm text-muted-foreground font-normal">
              You don't have permission to view this page. Please contact your Workspace admin or the document owner to request access.
            </p>
          </div>

          {/* 3. Phần nút Sign in (Nằm sát mép trên do pt-0 / mt-0) */}
          <div className="flex justify-center w-full pt-0">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="h-8 gap-1.5 py-2 px-2.5 text-sm font-medium"
            >
              Go to Workspaces <ArrowRight size={16} />
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}
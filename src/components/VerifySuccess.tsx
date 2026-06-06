import hero from "@/assets/images/verify-success-hero.png";
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
const VerifySuccess = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-[460px] bg-background">
      {/* Thẻ div cha điều hướng flex theo chiều dọc */}
      <div className="flex flex-col items-center w-[649px] bg-transparent">
        
        {/* 1. Hình ảnh 300x300 sát mép trên của thẻ div cha */}
        <div className="w-75 h-75 overflow-hidden shrink-0">
          <img 
            src={hero}
            alt="Verify Success Hero" 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* 2. Thẻ div ở giữa có chiều cao cố định 100px */}
        <div className="w-full h-25 flex flex-col justify-center items-center gap-2 shrink-0">
          <h1 className="font-sans font-semibold text-4xl text-center tracking-normal leading-tight text-foreground">
            Welcome to Folio!
          </h1>
          
          <p className="font-sans font-normal text-base text-center tracking-normal leading-normal text-muted-foreground">
            Email verified successfully. Your smart, organized document home is ready to explore.
          </p>
        </div>

        {/* 3. Thẻ ở dưới cùng chứa nút (Nút nằm sát mép trên của thẻ này nhờ pt-0 hoặc tự thân vị trí flex) */}
        <div className="w-full flex justify-center pt-0 shrink-0 mt-4">
          <Button
            className='px-2.5 py-2 gap-1.5'
          >
            Go to Workspaces <ArrowRight size={16}/>
          </Button>
        </div>

      </div>
    </main>
  )
}

export default VerifySuccess
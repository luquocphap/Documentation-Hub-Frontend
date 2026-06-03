import React from 'react'
import hero from "@/assets/images/verify-success-hero.png";
import { Button } from './ui/Button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const VerifySuccess = () => {

    const navigate = useNavigate();

  return (
    <main className="flex flex-col items-center justify-center min-h-115 px-6 py-12">
        <div className="flex flex-col items-center text-center max-w-160">

          <div className="w-81.5 h-auto mb-7 object-center">
            <img src={hero} className="w-full h-full inset-0 object-cover" />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-2.5">
            Welcome to Folio!
          </h1>

          <span className="text-base text-primary-cyan leading-relaxed mb-1.5">
            Email verified successfully. Your smart, organized document home is ready to explore.
          </span>

          <Button children={`Go to Workspaces`}
                icon={<ArrowRight size={16} />}
                className='text-sm mt-2'
                onClick={() => navigate("/login")}
          />

        </div>
      </main>
  )
}

export default VerifySuccess
import { Type } from "lucide-react"
import { Button } from "./ui/Button"
import emptyIllustration from "@/assets/images/empty-folder.png";

const EmptyWorkspace = () => {
  return (
    <div className="flex flex-col flex-1">
        <div className="w-full h-145 flex flex-col gap-8 mx-auto">
            
            {/* THẺ TRÊN: Khu vực upload (Dashed border) */}
            <div className="w-full h-112.5 max-h-112.5 rounded-lg border border-dashed border-border bg-card/50 flex flex-col items-center justify-center gap-2.5 py-2.5 px-3">
            
                <img 
                    src={emptyIllustration} 
                    alt="Upload illustration" 
                    className="w-75 h-auto mb-4 opacity-80" 
                />
                
                <div className="text-center flex flex-col gap-1.5">
                    <h3 className="text-sm font-semibold text-foreground">Upload your first document</h3>
                    <p className="text-sm text-muted-foreground">
                        Drag & drop or click to upload a PDF (max 20MB).
                    </p>
                </div>
            </div>

            {/* THẺ DƯỚI: Nút tạo mới (Center Content) */}
            <div className="w-45.5 h-16 mx-auto flex flex-col items-center justify-center gap-3">
                <span className="text-[13px] text-muted-foreground">or start from scratch</span>
                <Button variant="outline" size="sm" className="w-full gap-2 text-foreground font-medium shadow-sm">
                    <Type className="w-4 h-4 text-muted-foreground" /> New blank document
                </Button>
            </div>

        </div>
    </div>
  )
}

export default EmptyWorkspace
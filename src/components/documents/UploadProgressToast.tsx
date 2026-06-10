import { useEffect, useState, useRef } from "react";
import { documentApi } from "@/api/api";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import axios from "axios"; // Dùng bản axios gốc để không bị đính kèm Cookie/Token của backend

interface UploadProgressToastProps {
  toastId: string | number;
  workspaceId: string;
  file: File;
  onSuccess: () => void;
}

export function UploadProgressToast({ toastId, workspaceId, file, onSuccess }: UploadProgressToastProps) {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const abortController = useRef<AbortController | null>(null);
  const [isCanceled, setIsCanceled] = useState(false);
  
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const uploadDocument = async () => {
      abortController.current = new AbortController();
      let createdDocId: string | null = null;

      try {
        // Bước 1: Tạo metadata cho document ở Backend trước để lấy ID
        const createRes = await documentApi.create({
          workspaceId,
          title: file.name
        });
        createdDocId = createRes.data._id;

        // Nếu user bấm Cancel trong lúc đang create -> văng lỗi để nhảy xuống catch
        if (isCanceled) throw new Error("canceled");

        // Bước 2: Gọi API lấy chữ ký Cloudinary từ Backend
        const sigResponse = await documentApi.getUploadSignature(createdDocId);
        const { signature, timestamp, cloudName, apiKey, folder, context, notification_url } = sigResponse.data;

        if (isCanceled) throw new Error("canceled");

        // Bước 3: Đóng gói dữ liệu theo chuẩn form của Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);
        formData.append('context', context);
        formData.append('notification_url', notification_url);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
        console.log("Trước khi gọi Cloudinary")

        // Bước 4: Upload thẳng lên Cloudinary dùng Axios (để lấy được tiến trình phần trăm & signal hủy)
        await axios.post(cloudinaryUrl, formData, {
          signal: abortController.current.signal,
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || file.size;
            const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
            setProgress(percentCompleted);
            setLoaded(progressEvent.loaded);
          }
        });

        // Tắt Toast loading và bật Toast success
        toast.dismiss(toastId);
        toast.success("Document uploaded successfully", {
        style: {
          backgroundColor: "bg-green-50",
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 500,
          fontSize: 'text-sm',
          letterSpacing: '0%',
          border: '1px solid bg-green-700',
        },
        classNames: { icon: 'text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5' }
      });
        
        onSuccess(); // Báo về list để refetch
      } catch (error: any) {
        // Xử lý khi user ấn Cancel hoặc Request bị abort
        if (axios.isCancel(error) || error.message === "canceled" || isCanceled) {
            console.log("Lỗi hủy tiến trình", isCanceled)
          // Xóa rác: Backend đã tạo Doc ở Bước 1, phải xóa đi
          if (createdDocId) documentApi.delete(createdDocId).catch(() => {});
          toast.dismiss(toastId);
        } else {
          // Lỗi thật sự (rớt mạng, sai key...)
          toast.dismiss(toastId);
          toast.error("Upload failed. Please try again.");
          console.error("Cloudinary Upload Error:", error);
          
          // Cũng nên xóa rác nếu upload fail
          if (createdDocId) documentApi.delete(createdDocId).catch(() => {});
        }
      }
    };

    uploadDocument();

    return () => {
    //   if (abortController.current) abortController.current.abort();
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
  };

  const handleCancel = () => {
    setIsCanceled(true);
    if (abortController.current) abortController.current.abort();
  };

  return (
    <div className="w-95 bg-white border border-[#E5E5E5] rounded-[10px] flex flex-col overflow-hidden shadow-lg font-sans">
      <div className="p-3.5 flex items-center gap-3">
        
        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-gray-700" />
          <span className="text-[9px] font-bold mt-0.5 text-gray-700">PDF</span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-0.5">
            <span>{formatBytes(loaded)} / {formatBytes(file.size)}</span>
            <span>·</span>
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            <span>Uploading...</span>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleCancel} className="shrink-0 bg-white shadow-sm font-medium px-3 h-8">
          Cancel
        </Button>
      </div>

      <div className="w-full h-1.5 bg-gray-100">
        <div
          className="h-full bg-[#1A1A1A] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
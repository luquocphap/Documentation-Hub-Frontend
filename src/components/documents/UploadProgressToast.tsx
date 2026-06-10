import { useEffect, useState, useRef } from "react";
import { documentApi } from "@/api/api";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import axios from "axios";

interface UploadProgressToastProps {
  toastId: string | number;
  workspaceId: string;
  file: File;
  onSuccess: () => void;
}

type UploadStatus = "uploading" | "success" | "error";

export function UploadProgressToast({ toastId, workspaceId, file, onSuccess }: UploadProgressToastProps) {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("uploading");
  const [errorMessage, setErrorMessage] = useState("");

  const abortController = useRef<AbortController | null>(null);
  const hasStartedRef = useRef(false);

useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    if (file.type !== "application/pdf") {
      setStatus("error");
      setErrorMessage("Only PDF files are supported.");
      
      // Tự động đóng toast lỗi validation sau 3 giây
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setStatus("error");
      setErrorMessage("File size exceeds 20MB limit.");
      
      // Tự động đóng toast lỗi dung lượng sau 3 giây
      setTimeout(() => {
        toast.dismiss(toastId);
      }, 3000);
      return;
    }

    // --- BẮT ĐẦU UPLOAD ---
    const uploadDocument = async () => {
      abortController.current = new AbortController();
      let createdDocId: string | null = null;

      try {
        const createRes = await documentApi.create({ workspaceId, title: file.name });
        createdDocId = createRes.data._id;

        const sigResponse = await documentApi.getUploadSignature(createdDocId);
        const { signature, timestamp, cloudName, apiKey, folder, context, notification_url } = sigResponse.data;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);
        formData.append('context', context);
        formData.append('notification_url', notification_url);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

        await axios.post(cloudinaryUrl, formData, {
          signal: abortController.current.signal,
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || file.size;
            const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
            setProgress(percentCompleted);
            setLoaded(progressEvent.loaded);
          }
        });

        // Đổi trạng thái sang Success
        setStatus("success");
        setLoaded(file.size);
        onSuccess(); 

        // Tự động đóng toast thành công sau 3 giây
        setTimeout(() => {
          toast.dismiss(toastId);
        }, 3000);

      } catch (error: any) {
        if (axios.isCancel(error) || error.message === "canceled") {
          if (createdDocId) documentApi.delete(createdDocId).catch(() => {});
          toast.dismiss(toastId);
        } else {
          setStatus("error");
          setErrorMessage("Upload failed. Please try again.");
          if (createdDocId) documentApi.delete(createdDocId).catch(() => {});
          setTimeout(() => {
            toast.dismiss(toastId);
          }, 3000);
        }
      }
    };

    uploadDocument();

    return () => {};
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
  };

  const handleCancel = () => {
    if (abortController.current) abortController.current.abort();
    toast.dismiss(toastId); // Đóng thẳng khi user chủ động hủy
  };

  return (
    <div className="w-95 bg-white border border-[#E5E5E5] rounded-[10px] flex flex-col overflow-hidden shadow-lg font-sans">
      <div className="p-3.5 flex items-center gap-3">
        
        {/* Box Icon Mặc định */}
        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-gray-700" />
          <span className="text-[9px] font-bold mt-0.5 text-gray-700">PDF</span>
        </div>

        {/* Nội dung thông tin */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
          
          {/* Trạng thái 1: Đang Upload */}
          {status === "uploading" && (
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-0.5">
              <span>{formatBytes(loaded)} / {formatBytes(file.size)}</span>
              <span>·</span>
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span>Uploading...</span>
            </div>
          )}

          {/* Trạng thái 2: Thành công */}
          {status === "success" && (
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-0.5">
              <span>{formatBytes(file.size)} / {formatBytes(file.size)}</span>
              <span>·</span>
              <CheckCircle2 className="w-3.5 h-3.5 fill-green-700 text-white" />
              <span className="text-green-700 font-medium">Completed</span>
            </div>
          )}

          {/* Trạng thái 3: Lỗi (Validation hoặc Rớt mạng) */}
          {status === "error" && (
            <div className="flex items-center gap-1.5 text-[13px] text-red-500 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="font-medium truncate">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Cột Nút Bấm bên phải */}
        {status === "uploading" && (
          <Button variant="outline" size="sm" onClick={handleCancel} className="shrink-0 bg-white self-start shadow-sm font-medium px-3 h-8">
            Cancel
          </Button>
        )}

        {status === "success" && (
          <Button variant="outline" size="sm" onClick={() => toast.info('View logic coming soon')} className="shrink-0 self-start bg-white shadow-sm font-medium px-3 h-8">
            View
          </Button>
        )}

        {status === "error" && (
          <button onClick={() => toast.dismiss(toastId)} className="w-8 h-8 self-start flex items-center justify-center rounded-md border border-border hover:bg-gray-50 text-muted-foreground transition-colors shrink-0 outline-none">
            <X size={16} />
          </button>
        )}

      </div>

      {/* Thanh Load dưới đáy (Chỉ hiện khi đang upload) */}
      {status === "uploading" && (
        <div className="w-full h-1.5 bg-gray-100">
          <div
            className="h-full bg-[#1A1A1A] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
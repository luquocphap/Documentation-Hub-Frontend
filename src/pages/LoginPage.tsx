import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { authApi, type LoginInput } from "@/api/api";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { getBadRequestMessage } from "@/lib/apiValidation";
import { CircleAlert } from "lucide-react";


export default function LoginPage() {
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;

    // Kiểm tra email rỗng
    if (!formData.email.trim()) {
      newErrors.email = "Mandatory field";
      isValid = false;
    }
    
    // Kiểm tra password rỗng
    if (!formData.password) {
      newErrors.password = "Mandatory field";
      isValid = false;
    }

    // Cập nhật state lỗi cho các ô
    setFieldErrors(newErrors);
    return isValid;
  };

  const handleChange =
    (fieldName: keyof LoginInput) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormData((currentData) => ({
        ...currentData,
        [fieldName]: event.target.value,
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  
    // Xóa các lỗi cũ trước khi submit lần mới
    setGeneralError("");
    setFieldErrors({});

    if (!validateForm()) {
      return; 
    }

    //  Nếu frontend hợp lệ, tiến hành gọi API
    setIsSubmitting(true);
    try {
      await authApi.login(formData);
      alert("Login thành công")
    } catch (error: any) {
      console.log({ error });
      // Xử lý lỗi trả về từ Backend
      if (error.response?.status === 400) {
        setGeneralError(getBadRequestMessage(error));
      } else {
        setGeneralError("Đã có lỗi xảy ra từ máy chủ.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">Welcome back</h1>
          <p className="text-sm text-primary-cyan">
            Sign in to access your Workspaces and documents.
          </p>
        </div>

        {generalError && (
          <div className="flex items-center gap-1 text-sm text-red-500">
            <CircleAlert size={14}/> {generalError}
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <Input 
            id="email"
            type="email"
            label="Email address"
            placeholder="name@company.com"
            value={formData.email}
            onChange={handleChange("email")}
            error={fieldErrors.email}
            required
          />
          
          <Input 
            id="password"
            type={isPasswordVisible ? "text" : "password"}
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange("password")}
            error={fieldErrors.password}
            required
            rightIcon={<EyeIcon isVisible={isPasswordVisible} />}
            rightIconLabel={isPasswordVisible ? "Hide password" : "Show password"}
            onRightIconClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
          />

          <Button type="submit" className="mt-2" disabled={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-primary-cyan mt-4">
          New to Folio?{" "}
          <a href="/register" className="font-semibold text-foreground hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}

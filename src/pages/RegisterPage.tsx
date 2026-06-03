import { AuthLayout } from "../components/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { authApi, type RegisterInput } from "@/api/api";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { getBadRequestMessage } from "@/lib/apiValidation";
import { CircleAlert } from "lucide-react";

type RegisterFormData = RegisterInput & {
  confirmPassword: string;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; fullname?: string, confirmPassword?: string }>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isAgreed, setIsAgreed] = useState<boolean>(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullname?: string, confirmPassword?: string } = {};
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

    if (!formData.fullName){
      newErrors.password = "Mandatory field";
      isValid = false;
    }

    if (!formData.confirmPassword){
      newErrors.confirmPassword = "Mandatory field";
      isValid = false;
    }

    if (formData.confirmPassword !== formData.password){
      newErrors.password = "Password must be the same";
      newErrors.confirmPassword = "Password must be the same";
      isValid = false;
    } else if (formData.password.length < 8){
      newErrors.password = "Password must be at least 8 characters long";
      newErrors.confirmPassword = "Password must be at least 8 characters long";
      isValid = false;
    }

    // Cập nhật state lỗi cho các ô
    setFieldErrors(newErrors);
    return isValid;
  };

  const handleChange =
    (fieldName: keyof RegisterFormData) => (event: ChangeEvent<HTMLInputElement>) => {
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

    if (!isAgreed) {
      setGeneralError("You must agree to all Terms of Service and Privacy Policy");
      return;
    }

    if (!validateForm()) {
      return; 
    }

    setIsSubmitting(true);

    const registerData: RegisterInput = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
    };

    try {
      await authApi.register(registerData);
    } catch (error: any) {
      console.log({error})
      // Xử lý lỗi trả về từ Backend
      if (error.response?.status === 400) {
        const newErrors: { email?: string; password?: string; fullname?: string, confirmPassword?: string } = {};
        const message = error.response.data.message;

        if (message === "Invalid email address"){
          newErrors.email = message;
          setFieldErrors(newErrors);
        } else if (message === "Existing email address") {
          newErrors.email = message;
          setFieldErrors(newErrors);
        } else{
          setGeneralError(getBadRequestMessage(error));
        }
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
          <h1 className="text-2xl font-bold mb-2 text-foreground">Create your account</h1>
          <p className="text-sm text-primary-cyan">
            Join Folio to collaborate on your team's documents.
          </p>
        </div>

        {generalError && (
          <div className="flex items-center gap-1 text-sm text-red-500">
            <CircleAlert size={14}/> {generalError}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input 
            id="fullName"
            type="text"
            label="Full name"
            placeholder="e.g. John Doe"
            value={formData.fullName}
            onChange={handleChange("fullName")}
            error={fieldErrors.fullname}
            required
          />

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
            placeholder="Enter a password (min. 8 characters)"
            value={formData.password}
            onChange={handleChange("password")}
            error={fieldErrors.password}
            required
            rightIcon={<EyeIcon isVisible={isPasswordVisible} />}
            rightIconLabel={isPasswordVisible ? "Hide password" : "Show password"}
            onRightIconClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
          />

          <Input 
            id="confirm-password"
            type={isConfirmPasswordVisible ? "text" : "password"}
            label="Confirm password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange("confirmPassword")}
            error={fieldErrors.confirmPassword}
            required
            rightIcon={<EyeIcon isVisible={isConfirmPasswordVisible} />}
            rightIconLabel={isConfirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
            onRightIconClick={() => setIsConfirmPasswordVisible((isVisible) => !isVisible)}
          />

          <div className="flex items-center gap-2 mt-1">
            <input 
              type="checkbox" 
              id="terms"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary" 
              required
            />
            <label htmlFor="terms" className="text-sm text-primary-cyan">
              I agree to all <a href="#" className="font-semibold text-foreground hover:underline">Terms of Service</a> and <a href="#" className="font-semibold text-foreground hover:underline">Privacy Policy</a>
            </label>
          </div>

          <Button type="submit" className="mt-2" disabled={isSubmitting}>
            Sign up
          </Button>
        </form>

        <p className="text-center text-sm text-primary-cyan mt-2">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-foreground hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}

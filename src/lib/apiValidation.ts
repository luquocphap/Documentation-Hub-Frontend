import axios from "axios";


interface BadRequestResponse {
  message?: string | string[];
}

export const getBadRequestMessage = (error: unknown): string => {
  if (!axios.isAxiosError<BadRequestResponse>(error) || error.response?.status !== 400) {
    return "";
  }

  const { message } = error.response?.data ?? {};

  if (Array.isArray(message) && message.length > 1) {
    return message.join(". ");
  }

  return (message as string) ?? "Invalid input";
};


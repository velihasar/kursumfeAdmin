import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/utils";

export interface SendContactMessagePayload {
  fullName: string;
  userEmail: string;
  subject: string;
  message: string;
}

export async function sendContactMessage(
  payload: SendContactMessagePayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await axiosInstance.post<string>(
      "/api/Contact/send",
      {
        FullName: payload.fullName.trim(),
        UserEmail: payload.userEmail.trim(),
        Subject: payload.subject.trim(),
        Message: payload.message.trim(),
      },
      { timeout: 30000 }
    );

    const msg =
      typeof res.data === "string"
        ? res.data
        : (res.data as any)?.message || "Mesajınız başarıyla iletildi.";

    return {
      success: true,
      message: msg || "Mesajınız başarıyla iletildi.",
    };
  } catch (err: any) {
    return {
      success: false,
      message: getApiErrorMessage(err, "Mesaj iletilirken bir hata oluştu."),
    };
  }
}

export function useSendContactMessage() {
  return useMutation({
    mutationFn: (payload: SendContactMessagePayload) => sendContactMessage(payload),
  });
}


import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main>
      <h1>Нууц үг шинэчлэх</h1>
      <p>Имэйл дэх холбоосоор ирсэн бол шинэ нууц үгээ оруулна. Хамгийн багадаа 8 тэмдэгт.</p>
      <Suspense fallback={<p>Ачаалж байна…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}

import { headers } from "next/headers";
import { LoginForm } from "@/components/login-form";
import { isAdminHost } from "@/lib/admin-host";

export default async function LoginPage() {
  const headerList = await headers();
  const adminDesk = isAdminHost(headerList.get("x-forwarded-host") || headerList.get("host"));
  return (
    <main>
      <h1>{adminDesk ? "Админ нэвтрэх" : "Нэвтрэх"}</h1>
      <p>
        {adminDesk
          ? "Ганц админ имэйл, нууц үгээр нэвтэрнэ. Нууц үгээ имэйл дэх холбоосоор шинэчилнэ."
          : "Тестийг бүртгэлгүй бөглөж болно. Төлбөрийн өмнө и-мэйлээр нэвтэрнэ."}
      </p>
      <LoginForm adminDesk={adminDesk} />
    </main>
  );
}

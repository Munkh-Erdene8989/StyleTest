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
          : "И-мэйлээ оруулбал нэг удаагийн код очно. Нууц үг байхгүй. Нэвтэрсэн төлөв 30 хоног хадгалагдана."}
      </p>
      <LoginForm adminDesk={adminDesk} />
    </main>
  );
}

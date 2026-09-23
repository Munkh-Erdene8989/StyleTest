import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid gap-4">
      <h1 className="text-2xl font-semibold">Нэвтрэх</h1>
      <p>Тестийг бүртгэлгүй бөглөж болно. Төлбөрийн өмнө и-мэйлээр нэвтэрнэ.</p>
      <LoginForm />
    </main>
  );
}

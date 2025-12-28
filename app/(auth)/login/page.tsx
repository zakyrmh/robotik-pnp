import LoginForm from "@/app/(auth)/login/_components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}

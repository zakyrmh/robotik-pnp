import LoginForm from "./_components/LoginForm";

// Separation of Concerns:
// This is a Server Component.
// It effectively acts as a wrapper/container for the Login Page.
// It should not contain client-side logic (useState, hooks) or heavy UI computations if not needed.
// It renders the Client Component (LoginForm) dealing with the interactive parts.

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}

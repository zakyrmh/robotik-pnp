import { guardWaitingPage, getRegistrationStatus } from "@/lib/actions/waiting";
import { WaitingClient } from "@/components/waiting/waiting-client";

// Server Component — guard jalan di sini sebelum render apapun
export default async function WaitingPage() {
  await guardWaitingPage();

  const result = await getRegistrationStatus();

  const submittedAt =
    result.success && result.submittedAt
      ? new Date(result.submittedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <WaitingClient
      fullName={result.success ? (result.fullName ?? null) : null}
      submittedAt={submittedAt}
      status={(result.success ? result.status : "pending") ?? "pending"}
    />
  );
}

import { notFound } from "next/navigation";
import { getRegistrationByAccessTokenAction } from "@/lib/actions/event-registration";
import { ETicketClientView } from "@/components/event/e-ticket-view";

export default async function ETicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await getRegistrationByAccessTokenAction(token);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <ETicketClientView registration={res.data} />
      </div>
    </div>
  );
}

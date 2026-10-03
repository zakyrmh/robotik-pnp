import { notFound } from "next/navigation";
import {
  getRegistrationByAccessTokenAction,
  getRegistrationChangeRequestAction,
} from "@/lib/actions/event-registration";
import { getEventSettingsAction } from "@/lib/actions/event-admin";
import { getActiveBatch } from "@/lib/event-batch";
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

  const [settingsRes, changeReqRes] = await Promise.all([
    getEventSettingsAction(),
    getRegistrationChangeRequestAction(token),
  ]);

  const registrationOpen = Boolean(
    getActiveBatch(settingsRes.success ? settingsRes.data : null, new Date()),
  );
  const hasPendingChangeRequest =
    changeReqRes.success && changeReqRes.data?.status === "pending";

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <ETicketClientView
          registration={res.data}
          registrationOpen={registrationOpen}
          hasPendingChangeRequest={hasPendingChangeRequest}
        />
      </div>
    </div>
  );
}

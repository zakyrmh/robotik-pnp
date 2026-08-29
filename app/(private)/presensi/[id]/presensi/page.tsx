import { redirect } from "next/navigation";

export default async function PresensiAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/presensi/${id}/absensi`);
}

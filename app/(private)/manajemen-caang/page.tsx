import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCaangList } from "@/lib/actions/caang";
import { CaangClient } from "./CaangClient";

interface RawRegistration {
  id: string;
  full_name: string | null;
  nickname: string | null;
  gender: string | null;
  pob: string | null;
  dob: string | null;
  phone_number: string | null;
  origin_address: string | null;
  domicile_address: string | null;
  high_school: string | null;
  current_class: string | null;
  entry_year: number | null;
  motivation: string | null;
  org_experience: string | null;
  achievements: string | null;
  photo_url: string | null;
  ktm_url: string | null;
  proof_follow_robotik: string | null;
  proof_follow_mrc: string | null;
  proof_sub_yt: string | null;
  payment_proof_url: string | null;
  payment_method: string | null;
  status: string | null;
  deleted_at: string | null;
  delete_reason: string | null;
  profiles: {
    id: string;
    email: string;
    nim: string | null;
    role: string;
    is_onboarded: boolean;
  } | {
    id: string;
    email: string;
    nim: string | null;
    role: string;
    is_onboarded: boolean;
  }[] | null;
  study_programs: {
    id: string;
    name: string;
    degree: string;
    majors: {
      id: string;
      name: string;
    } | {
      id: string;
      name: string;
    }[] | null;
  } | null;
}

export default async function ManajemenCaangPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const rawProfile = profile as { id: string; role: string } | null;

  if (!rawProfile || (rawProfile.role !== "admin-or" && rawProfile.role !== "super-admin")) {
    redirect("/dashboard");
  }

  // Fetch caang candidates
  const caangRes = await getCaangList();
  const caangData = (caangRes.success && caangRes.data ? caangRes.data : []) as unknown as RawRegistration[];

  // Format Caang data for the client component
  const formattedCaang = caangData.map((reg) => {
    const profile = Array.isArray(reg.profiles)
      ? reg.profiles[0]
      : reg.profiles || { id: "", email: "", nim: "", role: "caang", is_onboarded: false };
    const sp = Array.isArray(reg.study_programs)
      ? reg.study_programs[0]
      : reg.study_programs || { id: "", name: "", degree: "", majors: null };
    const major = sp && Array.isArray(sp.majors)
      ? sp.majors[0]
      : sp?.majors || { id: "", name: "" };

    return {
      profileId: profile.id || "",
      email: profile.email || "",
      nim: profile.nim || "",
      isOnboarded: profile.is_onboarded || false,
      fullName: reg.full_name || "Calon Anggota",
      nickname: reg.nickname || "",
      gender: reg.gender || "",
      pob: reg.pob || "",
      dob: reg.dob || "",
      phoneNumber: reg.phone_number || "",
      originAddress: reg.origin_address || "",
      domicileAddress: reg.domicile_address || "",
      highSchool: reg.high_school || "",
      currentClass: reg.current_class || "",
      entryYear: reg.entry_year || null,
      motivation: reg.motivation || "",
      orgExperience: reg.org_experience || "",
      achievements: reg.achievements || "",
      photoUrl: reg.photo_url || "",
      ktmUrl: reg.ktm_url || "",
      proofFollowRobotik: reg.proof_follow_robotik || "",
      proofFollowMrc: reg.proof_follow_mrc || "",
      proofSubYt: reg.proof_sub_yt || "",
      paymentProofUrl: reg.payment_proof_url || "",
      paymentMethod: reg.payment_method || "",
      status: reg.status || "process",
      studyProgramId: sp.id || "",
      studyProgramName: sp.name ? `${sp.degree} ${sp.name}` : "",
      majorName: major.name || "",
      deletedAt: reg.deleted_at || null,
      deleteReason: reg.delete_reason || null,
    };
  });

  return (
    <CaangClient
      initialCaang={formattedCaang}
    />
  );
}

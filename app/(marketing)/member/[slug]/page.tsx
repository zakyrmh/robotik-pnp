import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  Mail,
  BookOpen,
  Award,
  Shield,
  User,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";

type Params = Promise<{ slug: string }>;

// Helper to normalize Supabase join results to a single object
function toSingle<T extends object>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw as T[])[0] ?? null;
  return raw;
}

// -------------------------------------------------------------------------
// TypeScript Interfaces for strict type safety
// -------------------------------------------------------------------------
interface MemberMetadataResult {
  full_name: string;
  study_programs: { name: string } | { name: string }[] | null;
}

interface MajorInfo {
  name: string;
}

interface StudyProgramInfo {
  name: string;
  degree: string;
  majors: MajorInfo | MajorInfo[] | null;
}

interface ProfileInfo {
  id: string;
  email: string;
  role: "super-admin" | "admin-or" | "admin-komdis" | "anggota" | "caang";
}

interface MemberProfileResult {
  nim: string;
  full_name: string;
  avatar_url: string | null;
  slug: string | null;
  gender: string | null;
  profile_id: string | null;
  study_programs: StudyProgramInfo | StudyProgramInfo[] | null;
  profiles: ProfileInfo | ProfileInfo[] | null;
}

interface RawHistory {
  role_name: string;
  sub_section: string | null;
  sort_order: number | null;
  membership_periods:
    | { period_name: string; is_active: boolean }
    | { period_name: string; is_active: boolean }[]
    | null;
  departments:
    | { name: string; category: string }
    | { name: string; category: string }[]
    | null;
  divisions:
    | {
        name: string;
        slug: string;
        accent_color: string | null;
        badge_color: string | null;
      }
    | {
        name: string;
        slug: string;
        accent_color: string | null;
        badge_color: string | null;
      }[]
    | null;
}

interface ArticleItem {
  title: string;
  slug: string;
  category: string;
  published_at: string | null;
}

// -------------------------------------------------------------------------
// Metadata Generator
// -------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  try {
    const { data: rawMember } = await supabase
      .from("legacy_members")
      .select(
        `
        full_name,
        study_programs:legacy_members_study_program_id_fkey ( name )
      `,
      )
      .eq("slug", slug)
      .single();

    if (!rawMember) {
      return {
        title: "Anggota Tidak Ditemukan | UKM Robotik PNP",
      };
    }

    const member = rawMember as unknown as MemberMetadataResult;
    const name = member.full_name || "Anggota";
    const sp = toSingle(member.study_programs);
    const prodi = sp?.name || "";

    return {
      title: `${name} — Profil Pengurus | UKM Robotik PNP`,
      description: `Profil ${name}${prodi ? `, mahasiswa Program Studi ${prodi}` : ""}. Kenali kontribusi, riwayat jabatan, dan karya mereka di UKM Robotik Politeknik Negeri Padang.`,
      openGraph: {
        title: `${name} — Profil Pengurus | UKM Robotik PNP`,
        description: `Mengenal lebih dekat ${name}, pengurus aktif/alumni dari UKM Robotika PNP. Lihat peran riset, riwayat kepengurusan, dan artikel yang ditulis.`,
        type: "profile",
      },
    };
  } catch (error) {
    console.error("[member-metadata] error generating metadata:", error);
    return {
      title: "Profil Pengurus | UKM Robotik PNP",
    };
  }
}

// -------------------------------------------------------------------------
// Member Profile Page Component
// -------------------------------------------------------------------------
export default async function MemberProfilePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // 1. Fetch member core profile
  const { data: rawMember, error: memberError } = await supabase
    .from("legacy_members")
    .select(
      `
      nim,
      full_name,
      avatar_url,
      slug,
      gender,
      profile_id,
      study_programs:legacy_members_study_program_id_fkey (
        name,
        degree,
        majors ( name )
      ),
      profiles:legacy_members_profile_id_fkey (
        id,
        email,
        role
      )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (memberError) {
    console.error(
      "[member-profile] error fetching member profile:",
      memberError.message,
    );
    notFound();
  }

  const member = rawMember as unknown as MemberProfileResult | null;
  if (!member) {
    notFound();
  }

  // 2. Fetch organizational history for this member
  const { data: rawHistories, error: historiesError } = await supabase
    .from("organizational_histories")
    .select(
      `
      role_name,
      sub_section,
      sort_order,
      membership_periods:org_histories_period_fkey (
        period_name,
        is_active
      ),
      departments:org_histories_department_fkey (
        name,
        category
      ),
      divisions:org_histories_division_id_fkey (
        name,
        slug,
        accent_color,
        badge_color
      )
    `,
    )
    .eq("nim_member", member.nim);

  if (historiesError) {
    console.error(
      "[member-profile] error fetching histories:",
      historiesError.message,
    );
  }

  const histories = ((rawHistories as unknown as RawHistory[]) ?? []).map(
    (h) => ({
      roleName: h.role_name,
      subSection: h.sub_section,
      sortOrder: h.sort_order,
      period: toSingle(h.membership_periods),
      department: toSingle(h.departments),
      division: toSingle(h.divisions),
    }),
  );

  // Sort histories: Active period first, then latest period name desc, then sort_order asc
  const sortedHistories = [...histories].sort((a, b) => {
    const activeA = a.period?.is_active ? 1 : 0;
    const activeB = b.period?.is_active ? 1 : 0;
    if (activeA !== activeB) return activeB - activeA;

    const periodA = a.period?.period_name || "";
    const periodB = b.period?.period_name || "";
    const periodCompare = periodB.localeCompare(periodA);
    if (periodCompare !== 0) return periodCompare;

    const sortA = a.sortOrder ?? 999;
    const sortB = b.sortOrder ?? 999;
    return sortA - sortB;
  });

  const activeHistory = sortedHistories[0];

  // 3. Fetch registration information (for motivation quote and achievements) if profile is connected
  let registration: {
    motivation: string | null;
    org_experience: string | null;
    achievements: string | null;
  } | null = null;
  const profile = toSingle(member.profiles);
  if (profile?.id) {
    const { data: rawReg, error: regError } = await supabase
      .from("registrations")
      .select("motivation, org_experience, achievements")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!regError && rawReg) {
      registration = rawReg;
    }
  }

  // 4. Fetch articles written by this member
  let articles: ArticleItem[] = [];
  if (profile?.id) {
    const { data: rawArticles, error: articlesError } = await supabase
      .from("articles")
      .select("title, slug, category, published_at")
      .eq("author_id", profile.id)
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (!articlesError && rawArticles) {
      articles = rawArticles as unknown as ArticleItem[];
    }
  }

  const sp = toSingle(member.study_programs);
  const prodi = sp ? `${sp.degree} ${sp.name}` : null;
  const rawMajors = sp?.majors;
  const majors = toSingle(rawMajors);
  const jurusan = majors?.name || null;

  return (
    <div className="bg-canvas-dark text-foreground min-h-screen pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <Link
          href="/keanggotaan"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-cyber-blue font-jetbrains text-xs uppercase tracking-wider mb-10 transition-colors"
          id="btn-back-keanggotaan"
        >
          <ArrowLeft className="w-4 h-4" /> [KEMBALI KE KEANGGOTAAN]
        </Link>

        {/* Hero Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start mb-12">
          {/* Left Side: Avatar */}
          <div className="flex justify-center md:col-span-1">
            {member.avatar_url ? (
              <div className="relative w-48 h-48 md:w-full md:h-auto md:aspect-square border border-hairline-dark rounded-none overflow-hidden shrink-0 bg-surface-card-dark">
                <Image
                  src={member.avatar_url}
                  alt={member.full_name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 192px, 256px"
                />
              </div>
            ) : (
              <div className="w-48 h-48 md:w-full md:aspect-square border border-hairline-dark rounded-none bg-surface-card-dark flex flex-col items-center justify-center shrink-0">
                <User className="w-16 h-16 text-muted-foreground/30 mb-2" />
                <span className="font-jetbrains text-muted-foreground text-4xl uppercase font-bold">
                  {member.full_name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Right Side: Identity Details */}
          <div className="md:col-span-3 space-y-6">
            <div className="space-y-3">
              {activeHistory && (
                <span className="inline-block px-3 py-1 bg-cyber-blue/10 text-cyber-blue font-jetbrains text-[10px] font-semibold uppercase tracking-wider rounded-sm border border-cyber-blue/20">
                  {activeHistory.roleName}
                  {activeHistory.department?.name
                    ? ` — ${activeHistory.department.name}`
                    : ""}
                </span>
              )}
              <h1 className="text-display-lg md:text-display-xl font-bold uppercase tracking-tight text-foreground leading-tight">
                {member.full_name}
              </h1>
              <p className="font-jetbrains text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-cyber-blue">{"//"}</span> NIM.{" "}
                {member.nim}
              </p>
            </div>

            {/* Academic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-hairline-dark/60 pt-6">
              {prodi && (
                <div className="flex gap-3">
                  <GraduationCap className="w-5 h-5 text-cyber-blue shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-jetbrains text-muted-foreground uppercase tracking-wider">
                      {"// Program Studi"}
                    </h4>
                    <p className="text-body-md font-bold text-foreground/90">
                      {prodi}
                    </p>
                    {jurusan && (
                      <p className="text-xs text-muted-foreground font-light">
                        {jurusan}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {profile?.email && (
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-cyber-blue shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-jetbrains text-muted-foreground uppercase tracking-wider">
                      {"// Kontak"}
                    </h4>
                    <p className="text-body-md font-bold text-foreground/90 truncate max-w-xs">
                      {profile.email}
                    </p>
                    <p className="text-xs text-muted-foreground font-light">
                      E-mail Resmi Anggota
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tech Tricolor Stripe Divider */}
        <div className="h-1 bg-gradient-to-r from-cyber-blue via-tech-navy to-crimson-red my-12 w-full" />

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left & Middle Column (Timeline & Motivation) */}
          <div className="lg:col-span-2 space-y-12">
            {/* Timeline Section */}
            <div className="space-y-6">
              <h2 className="text-display-md font-bold uppercase tracking-tight text-foreground border-b border-hairline-dark/60 pb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyber-blue" /> Riwayat
                Kepengurusan
              </h2>

              {sortedHistories.length > 0 ? (
                <div className="relative border-l border-hairline-dark ml-3 pl-6 space-y-8">
                  {sortedHistories.map((hist, idx) => {
                    const isCurrent = hist.period?.is_active;
                    return (
                      <div key={idx} className="relative group">
                        {/* Timeline Bullet */}
                        <div
                          className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 border-2 rounded-none transition-all duration-300 ${
                            isCurrent
                              ? "bg-cyber-blue border-cyber-blue shadow-[0_0_8px_rgba(0,102,177,0.5)]"
                              : "bg-canvas-dark border-hairline-dark group-hover:border-cyber-blue"
                          }`}
                        />

                        <div className="space-y-1">
                          <span
                            className={`font-jetbrains text-xs font-bold tracking-wider ${isCurrent ? "text-cyber-blue" : "text-muted-foreground"}`}
                          >
                            [
                            {hist.period?.period_name ||
                              "Periode Tidak Diketahui"}
                            ] {isCurrent && "(Aktif)"}
                          </span>
                          <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">
                            {hist.roleName}
                          </h3>
                          <div className="text-sm font-light text-muted-foreground space-y-1">
                            {hist.department && (
                              <p>
                                Departemen:{" "}
                                <span className="font-jetbrains text-xs text-foreground/80">
                                  {hist.department.name}
                                </span>
                              </p>
                            )}
                            {hist.subSection && (
                              <p>
                                Sub Seksi:{" "}
                                <span className="font-jetbrains text-xs text-foreground/80">
                                  {hist.subSection}
                                </span>
                              </p>
                            )}
                            {hist.division && (
                              <div className="mt-2 flex items-center gap-2">
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-none border border-hairline-dark"
                                  style={{
                                    backgroundColor:
                                      hist.division.accent_color || "#0066b1",
                                  }}
                                />
                                <p className="text-xs">
                                  Tim Kontes:{" "}
                                  <span className="font-bold text-foreground/90">
                                    {hist.division.name}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 bg-surface-card-dark/30 border border-hairline-dark text-center text-muted-foreground font-jetbrains text-sm">
                  [BELUM ADA RIWAYAT KEPENGURUSAN TERCATAT]
                </div>
              )}
            </div>

            {/* Achievements / Pengalaman (dari registrasi Oprec) */}
            {registration &&
              (registration.achievements || registration.org_experience) && (
                <div className="space-y-6">
                  <h2 className="text-display-md font-bold uppercase tracking-tight text-foreground border-b border-hairline-dark/60 pb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-cyber-blue" /> Pencapaian &
                    Pengalaman
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {registration.achievements && (
                      <div className="bg-surface-card-dark/20 border border-hairline-dark p-5 rounded-none space-y-2">
                        <h3 className="font-jetbrains text-xs text-cyber-blue uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />{" "}
                          {"// Prestasi Personal"}
                        </h3>
                        <p className="text-sm font-light text-foreground/80 whitespace-pre-line leading-relaxed">
                          {registration.achievements}
                        </p>
                      </div>
                    )}

                    {registration.org_experience && (
                      <div className="bg-surface-card-dark/20 border border-hairline-dark p-5 rounded-none space-y-2">
                        <h3 className="font-jetbrains text-xs text-cyber-blue uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" />{" "}
                          {"// Pengalaman Organisasi"}
                        </h3>
                        <p className="text-sm font-light text-foreground/80 whitespace-pre-line leading-relaxed">
                          {registration.org_experience}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Right Column (Motivation & Written Articles) */}
          <div className="space-y-8 lg:col-span-1">
            {/* Motivation Box */}
            {registration?.motivation && (
              <div className="bg-surface-card-dark/30 border border-hairline-dark p-6 rounded-none relative space-y-3">
                <h3 className="font-jetbrains text-[10px] text-cyber-blue uppercase tracking-wider font-bold">
                  {"// Motivasi Bergabung"}
                </h3>
                <blockquote className="text-body-md font-light italic text-foreground/80 border-l-2 border-cyber-blue pl-4">
                  &ldquo;{registration.motivation}&rdquo;
                </blockquote>
              </div>
            )}

            {/* Written Articles Section */}
            <div className="space-y-4">
              <h3 className="font-jetbrains text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-b border-hairline-dark/60 pb-3">
                <BookOpen className="w-4 h-4 text-cyber-blue" /> [KARYA &
                TUTORIAL]
              </h3>

              {articles.length > 0 ? (
                <div className="space-y-3">
                  {articles.map((art) => (
                    <Link
                      key={art.slug}
                      href={`/artikel/${art.slug}`}
                      className="block p-4 bg-surface-card-dark border border-hairline-dark hover:border-cyber-blue transition-all duration-300 hover:shadow-[0_0_12px_rgba(0,102,177,0.15)] group rounded-none"
                    >
                      <span className="font-jetbrains text-[9px] text-cyber-blue uppercase tracking-wider block mb-1">
                        {art.category}
                      </span>
                      <h4 className="font-sans font-bold text-foreground group-hover:text-cyber-blue transition-colors text-sm uppercase leading-snug">
                        {art.title}
                      </h4>
                      <span className="font-jetbrains text-[9px] text-muted-foreground block mt-2">
                        {new Date(art.published_at || "").toLocaleDateString(
                          "id-ID",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-surface-card-dark/10 border border-hairline-dark border-dashed text-center text-muted-foreground font-jetbrains text-xs">
                  [Belum ada karya tulis dipublikasikan]
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

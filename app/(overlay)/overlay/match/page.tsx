"use client";

/**
 * Overlay Match — Tampil dengan Background Image
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

// ═══════════════════════════════════════════════
// TIPE
// ═══════════════════════════════════════════════

interface MatchData {
  id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  is_swapped: boolean;
  status: string;
  score_a?: number | null;
  score_b?: number | null;
}

interface TeamInfo {
  team_name: string;
}

interface TournamentMatchData {
  id: string;
  status: string | null;
  field: string | null;
  score_a: number | null;
  score_b: number | null;
  team_a: { name: string } | null;
  team_b: { name: string } | null;
}

// ═══════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════

export default function MatchOverlayPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") ?? "";
  const categoryId = searchParams.get("cat") ?? "";
  const field = searchParams.get("field") ?? "arena_1";
  const isTournamentMode = !eventId && !categoryId;

  // Gunakan useMemo agar instance supabase tidak dibuat ulang setiap render
  const supabase = useMemo(() => createClient(), []);

  // State
  const [match, setMatch] = useState<MatchData | null>(null);
  const [tournamentMatch, setTournamentMatch] =
    useState<TournamentMatchData | null>(null);
  const [teamA, setTeamA] = useState<TeamInfo | null>(null);
  const [teamB, setTeamB] = useState<TeamInfo | null>(null);

  const fetchLiveMatch = useCallback(async () => {
    if (isTournamentMode) {
      const { data } = await supabase
        .from("matches")
        .select(
          `
          id,
          status,
          field,
          score_a,
          score_b,
          team_a:teams!matches_team_a_id_fkey(name),
          team_b:teams!matches_team_b_id_fkey(name)
        `,
        )
        .eq("field", field)
        .eq("status", "live")
        .limit(1)
        .maybeSingle();

      setTournamentMatch(data as unknown as TournamentMatchData | null);
      return;
    }

    const { data } = await supabase
      .from("mrc_matches")
      .select("*")
      .eq("event_id", eventId)
      .eq("category_id", categoryId)
      .eq("status", "live")
      .limit(1)
      .single();

    if (data) {
      setMatch(data as MatchData);

      if (data.team_a_id) {
        const { data: tA } = await supabase
          .from("mrc_teams")
          .select("team_name")
          .eq("id", data.team_a_id)
          .single();
        if (tA) setTeamA(tA);
      }
      if (data.team_b_id) {
        const { data: tB } = await supabase
          .from("mrc_teams")
          .select("team_name")
          .eq("id", data.team_b_id)
          .single();
        if (tB) setTeamB(tB);
      }
    } else {
      setMatch(null);
    }
  }, [eventId, categoryId, field, isTournamentMode, supabase]);

  useEffect(() => {
    if (isTournamentMode || (eventId && categoryId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchLiveMatch();
    }
  }, [eventId, categoryId, field, isTournamentMode, fetchLiveMatch]);

  // Efek Auto-Update (Realtime Subscriptions + Polling Fallback)
  useEffect(() => {
    // 1. Polling Fallback (setiap 2 detik refresh data)
    // Berfungsi sebagai jaminan jika realtime tidak menyala atau terputus
    const interval = setInterval(() => {
      fetchLiveMatch();
    }, 2000);

    // 2. Supabase Realtime Channels
    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (isTournamentMode) {
      channel = supabase
        .channel(`overlay-match-${field}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "matches",
            filter: `field=eq.${field}`,
          },
          () => fetchLiveMatch(),
        )
        .subscribe();
    } else if (eventId && categoryId) {
      channel = supabase
        .channel("overlay-match")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "mrc_matches",
            filter: `event_id=eq.${eventId}`,
          },
          () => fetchLiveMatch(),
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [eventId, categoryId, field, isTournamentMode, fetchLiveMatch, supabase]);

  const displayA = match?.is_swapped ? teamB : teamA;
  const displayB = match?.is_swapped ? teamA : teamB;

  // === RENDER TOURNAMENT MODE ===
  if (isTournamentMode) {
    if (!tournamentMatch) return <div className="fixed inset-0" />;

    return (
      <div className="fixed inset-0 text-white overflow-hidden">
        {/* GAMBAR BACKGROUND */}
        <Image
          src="/Overlay OBS.png"
          alt="Overlay Background"
          className="absolute inset-0 w-full h-full object-cover -z-10"
          width={1920}
          height={1080}
        />

        <div className="absolute bottom-[7%] left-[10%] w-[35%] h-[10%] flex items-center justify-center">
          <p className="text-6xl font-black uppercase tracking-wide truncate drop-shadow-md">
            {tournamentMatch.team_a?.name ?? "TIM A"}
          </p>
        </div>

        <div className="absolute bottom-[7%] right-[10%] w-[35%] h-[10%] flex items-center justify-center">
          <p className="text-6xl font-black uppercase tracking-wide truncate drop-shadow-md">
            {tournamentMatch.team_b?.name ?? "TIM B"}
          </p>
        </div>
      </div>
    );
  }

  // === RENDER NORMAL MODE ===
  if (!match) return <div className="fixed inset-0" />;

  return (
    <div className="fixed inset-0 text-white overflow-hidden">
      {/* GAMBAR BACKGROUND */}
      <Image
        src="/overlay-bg.jpg"
        alt="Overlay Background"
        className="absolute inset-0 w-full h-full object-cover -z-10"
        width={1920}
        height={1080}
      />

      <div className="absolute bottom-[4%] left-[7.5%] w-[35%] h-[10%] flex items-center justify-center">
        <p className="text-4xl font-black uppercase tracking-wide truncate drop-shadow-md">
          {displayA?.team_name ?? "TIM A"}
        </p>
      </div>

      <div className="absolute bottom-[4%] right-[11.5%] w-[35%] h-[10%] flex items-center justify-center">
        <p className="text-4xl font-black uppercase tracking-wide truncate drop-shadow-md">
          {displayB?.team_name ?? "TIM B"}
        </p>
      </div>
    </div>
  );
}

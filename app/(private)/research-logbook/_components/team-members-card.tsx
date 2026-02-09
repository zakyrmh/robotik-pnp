"use client";

import { useEffect, useState } from "react";
import { Users, Crown, Shield, UserCog, Wrench } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { KriTeam } from "@/schemas/users";
import {
  TeamMember,
  getTeamMembers,
  getManagementPositionLabel,
  getTechnicalRoleLabel,
  getManagementPositionColor,
  getTechnicalRoleColor,
} from "@/lib/firebase/services/team-member-service";

interface TeamMembersCardProps {
  team: KriTeam;
  className?: string;
}

/**
 * Mendapatkan icon untuk posisi manajemen
 */
function getPositionIcon(position: string) {
  switch (position) {
    case "chairman":
      return <Crown className="h-3.5 w-3.5" />;
    case "vice_chairman":
      return <Shield className="h-3.5 w-3.5" />;
    case "secretary":
    case "treasurer":
      return <UserCog className="h-3.5 w-3.5" />;
    default:
      return <Users className="h-3.5 w-3.5" />;
  }
}

/**
 * Mendapatkan icon untuk role teknis
 */
function getTechnicalIcon() {
  return <Wrench className="h-3.5 w-3.5" />;
}

/**
 * Komponen untuk menampilkan loading skeleton
 */
function TeamMemberSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Komponen card untuk menampilkan daftar anggota tim
 */
export function TeamMembersCard({ team, className }: TeamMembersCardProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        setIsLoading(true);
        const teamMembers = await getTeamMembers(team);
        setMembers(teamMembers);
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast.error("Gagal memuat data anggota tim");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMembers();
  }, [team]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Anggota Tim
        </CardTitle>
        <CardDescription>
          Daftar rekan kerja sesama divisi tim Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <TeamMemberSkeleton key={i} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3 w-fit mx-auto">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Belum ada anggota tim terdaftar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={member.photoUrl} alt={member.fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {member.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1.5 truncate">
                    {member.fullName}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-xs font-normal ${getManagementPositionColor(member.managementPosition)}`}
                    >
                      <span className="mr-1">
                        {getPositionIcon(member.managementPosition)}
                      </span>
                      {getManagementPositionLabel(member.managementPosition)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs font-normal ${getTechnicalRoleColor(member.technicalRole)}`}
                    >
                      <span className="mr-1">{getTechnicalIcon()}</span>
                      {getTechnicalRoleLabel(member.technicalRole)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && members.length > 0 && (
          <div className="mt-4 pt-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Total {members.length} anggota tim
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

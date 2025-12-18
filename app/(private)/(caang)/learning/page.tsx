"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { getMaterials } from "@/lib/firebase/materials";
import { getTasks } from "@/lib/firebase/tasks";
import { getTaskSubmissions } from "@/lib/firebase/task-submissions";
import { getRegistrationById } from "@/lib/firebase/services/registration-service";
import { Material } from "@/types/materials";
import { Task, TaskSubmission } from "@/types/tasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialCard } from "./_components/material-card";
import { TaskCard } from "./_components/task-card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LearningPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orPeriod, setOrPeriod] = useState<string | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<
    Record<string, TaskSubmission>
  >({});

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        setLoading(true);

        // 1. Get User Registration to find orPeriod
        const registration = await getRegistrationById(user.uid);
        if (!registration) {
          console.error("No registration found for user");
          setLoading(false);
          return;
        }
        setOrPeriod(registration.orPeriod);

        // 2. Fetch Materials & Tasks in parallel
        const [materialsData, tasksData, submissionsData] = await Promise.all([
          getMaterials({
            orPeriod: registration.orPeriod,
            isPublic: true,
          }),
          getTasks({
            orPeriod: registration.orPeriod,
            isVisible: true,
          }),
          getTaskSubmissions({
            userId: user.uid,
          }),
        ]);

        setMaterials(materialsData);
        setTasks(tasksData); // Ideally sort by deadline or priority here if not already done by DB

        // Map submissions by taskId for O(1) access
        const subMap: Record<string, TaskSubmission> = {};
        submissionsData.forEach((sub) => {
          subMap[sub.taskId] = sub;
        });
        setSubmissions(subMap);
      } catch (error) {
        console.error("Error fetching learning data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orPeriod) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Data registrasi tidak ditemukan. Silahkan hubungi admin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Materi & Tugas</h1>
        <p className="text-muted-foreground">
          Akses materi pembelajaran dan kerjakan tugas-tugas OR.
        </p>
      </div>

      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList>
          <TabsTrigger value="materials">Materi Pembelajaran</TabsTrigger>
          <TabsTrigger value="tasks">Tugas ({tasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          {materials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada materi yang tersedia.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada tugas yang tersedia.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sort tasks: Incomplete first, then by deadline */}
              {tasks
                .sort((a, b) => {
                  const subA = submissions[a.id];
                  const subB = submissions[b.id];
                  if (!subA && subB) return -1;
                  if (subA && !subB) return 1;
                  return a.deadline.toMillis() - b.deadline.toMillis();
                })
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    submission={submissions[task.id]}
                    currentUserId={user!.uid}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

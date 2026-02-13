"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  type InternshipRole,
  RollingInternshipBaseSchema,
} from "@/schemas/internship";
import { GripVertical } from "lucide-react";
import { Reorder } from "framer-motion";
import { KriTeamEnum } from "@/schemas/users";

// Schema for client-side form submission
// We omit system fields
const FormSchema = RollingInternshipBaseSchema.omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
}).refine((data) => data.divisionChoice1 !== data.divisionChoice2, {
  message: "Divisi pilihan 1 dan 2 tidak boleh sama",
  path: ["divisionChoice2"],
});

type FormValues = z.infer<typeof FormSchema>;

// Role options with labels
const ROLE_LABELS: Record<InternshipRole, string> = {
  mechanic: "Mekanik",
  wiring: "Wiring (Elektronika)",
  programmer: "Programmer",
};

// Initial roles for drag and drop
const INITIAL_ROLES: InternshipRole[] = ["mechanic", "wiring", "programmer"];

interface RollingInternshipFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function RollingInternshipForm({
  onSubmit,
  isSubmitting = false,
}: RollingInternshipFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      roleChoices: INITIAL_ROLES,
      roleReason: "",
      roleSkills: "",
      divisionChoice1: undefined,
      divisionChoice1Confidence: "doubtful",
      divisionChoice1Reason: "",
      divisionChoice2: undefined,
      divisionChoice2Confidence: "doubtful",
      divisionChoice2Reason: "",
    },
  });

  // Watch roleChoices for reordering logic
  const roleChoices = useWatch({ control: form.control, name: "roleChoices" });
  const selectedDivision1 = useWatch({
    control: form.control,
    name: "divisionChoice1",
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengirim form magang divisi rolling. Coba lagi.");
    }
  };

  // Reorder handler
  const handleReorder = (newOrder: InternshipRole[]) => {
    form.setValue("roleChoices", newOrder, { shouldValidate: true });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          Form Pendaftaran Magang Divisi Rolling
        </CardTitle>
        <CardDescription>
          Silakan isi formulir ini dengan jujur dan lengkap. Urutkan pilihan
          role sesuai prioritas kamu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {/* Role Preference - Drag and Drop */}
            <div className="space-y-4">
              <FormLabel className="text-base font-semibold">
                Urutan Prioritas Role (Drag & Drop)
              </FormLabel>
              <FormDescription>
                Geser (drag) pilihan di bawah ini untuk mengurutkan prioritas
                role yang kamu inginkan (atas = prioritas 1).
              </FormDescription>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border">
                <Reorder.Group
                  axis="y"
                  values={roleChoices}
                  onReorder={handleReorder}
                  className="flex flex-col gap-2"
                >
                  {roleChoices.map((role, index) => (
                    <Reorder.Item
                      key={role}
                      value={role}
                      className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 border rounded-md shadow-sm select-none cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 font-medium">
                        {ROLE_LABELS[role]}
                      </div>
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
              <FormMessage>
                {form.formState.errors.roleChoices?.message}
              </FormMessage>
            </div>

            {/* Role Reason */}
            <FormField
              control={form.control}
              name="roleReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan Memilih Urutan Role Tersebut</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan kenapa kamu memilih urutan tersebut..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Skills */}
            <FormField
              control={form.control}
              name="roleSkills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kemampuan yang Dimiliki (Sesuai Role)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan skill atau pengalaman yang relevan..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              {/* Division Choice 1 */}
              <div className="space-y-6">
                <div className="font-semibold text-lg flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground text-sm w-6 h-6 rounded-full flex items-center justify-center">
                    1
                  </span>
                  Pilihan Divisi Pertama
                </div>

                <FormField
                  control={form.control}
                  name="divisionChoice1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Divisi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Divisi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KriTeamEnum.options.map((team) => (
                            <SelectItem key={team} value={team}>
                              {team.toUpperCase().replace("_", "-")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="divisionChoice1Confidence"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Keyakinan</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="confident" />
                            </FormControl>
                            <FormLabel className="font-normal">Yakin</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="doubtful" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Ragu-ragu
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="divisionChoice1Reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alasan Pilihan 1</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Kenapa memilih divisi ini..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Division Choice 2 */}
              <div className="space-y-6">
                <div className="font-semibold text-lg flex items-center gap-2">
                  <span className="bg-muted text-muted-foreground text-sm w-6 h-6 rounded-full flex items-center justify-center">
                    2
                  </span>
                  Pilihan Divisi Kedua
                </div>

                <FormField
                  control={form.control}
                  name="divisionChoice2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Divisi (Selain Pilihan 1)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Divisi Kedua" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KriTeamEnum.options
                            .filter((team) => team !== selectedDivision1)
                            .map((team) => (
                              <SelectItem key={team} value={team}>
                                {team.toUpperCase().replace("_", "-")}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="divisionChoice2Confidence"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Keyakinan</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="confident" />
                            </FormControl>
                            <FormLabel className="font-normal">Yakin</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="doubtful" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Ragu-ragu
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="divisionChoice2Reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alasan Pilihan 2</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Kenapa memilih divisi ini..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-md text-sm text-yellow-800 dark:text-yellow-200">
              <strong>PENTING:</strong> Caang (Calon Anggota) dapat saja
              ditempatkan di divisi yang <strong>TIDAK</strong> dipilihnya,
              sesuai dengan kebutuhan tim dan penilaian kemampuan.
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Lanjut ke Magang Departemen"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

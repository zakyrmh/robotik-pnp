"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DepartmentInternshipRegistrationSchema } from "@/schemas/internship";

// Schema for client-side form submission
const FormSchema = DepartmentInternshipRegistrationSchema.omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
});

type FormValues = z.infer<typeof FormSchema>;

// Grouped department fields
const DEPT_GROUPS = [
  {
    label: "Departemen Kestari",
    options: [{ value: "kestari", label: "Bidang Kestari" }],
  },
  {
    label: "Departemen Metrolap",
    options: [
      { value: "maintenance", label: "Bidang Maintenance" },
      { value: "production", label: "Bidang Produksi" },
    ],
  },
  {
    label: "Departemen Infokom",
    options: [
      { value: "humas", label: "Bidang Humas" },
      { value: "infokom_field", label: "Bidang Infokom" },
    ],
  },
  {
    label: "Departemen Litbang",
    options: [
      { value: "kpsdm", label: "Bidang KPSDM" },
      { value: "ristek", label: "Bidang Ristek" },
    ],
  },
];

interface DepartmentInternshipFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function DepartmentInternshipForm({
  onSubmit,
  isSubmitting = false,
}: DepartmentInternshipFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fieldChoice: undefined,
      reason: "",
    },
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengirim form magang departemen.");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          Form Pendaftaran Magang Departemen
        </CardTitle>
        <CardDescription>
          Pilih satu bidang departemen yang paling kamu minati.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="fieldChoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilihan Bidang Departemen</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Bidang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPT_GROUPS.map((group) => (
                        <SelectGroup key={group.label}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Pilih salah satu bidang dari departemen yang tersedia.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan Memilih Bidang Tersebut</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan kenapa kamu tertarik dengan bidang ini..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Selesai & Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

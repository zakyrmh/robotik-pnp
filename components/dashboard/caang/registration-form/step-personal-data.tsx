"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Loader2, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRegistrationForm } from "./registration-form-context";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  getAllJurusan,
  getProdiByJurusan,
  Jurusan,
  ProgramStudi,
} from "@/lib/firebase/services/jurusan-prodi-service";

// =========================================================
// SCHEMA
// =========================================================

const personalDataSchema = z.object({
  nickname: z.string().min(2, "Nama panggilan minimal 2 karakter"),
  nim: z.string().min(8, "NIM minimal 8 karakter"),
  phone: z.string().min(10, "Nomor HP minimal 10 digit"),
  gender: z.enum(["male", "female"]),
  birthDate: z.date(),
  birthPlace: z.string().min(2, "Tempat lahir minimal 2 karakter"),
  address: z.string().min(10, "Alamat minimal 10 karakter"),
  major: z.string().min(2, "Program studi minimal 2 karakter"),
  department: z.string().min(2, "Jurusan minimal 2 karakter"),
  entryYear: z
    .number()
    .min(2020, "Tahun masuk minimal 2020")
    .max(2030, "Tahun masuk maksimal 2030"),
  motivation: z.string().min(50, "Motivasi minimal 50 karakter"),
  experience: z.string().optional(),
  achievement: z.string().optional(),
});

type PersonalDataFormValues = z.infer<typeof personalDataSchema>;

// =========================================================
// COMPONENT
// =========================================================

export function StepPersonalData() {
  const { updatePersonalData, isSaving, registration } = useRegistrationForm();
  const { user } = useDashboard();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [fullName, setFullName] = useState<string>("");

  // Jurusan & Prodi state
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [selectedJurusanId, setSelectedJurusanId] = useState<string>("");
  const [isLoadingProdi, setIsLoadingProdi] = useState(false);

  const form = useForm<PersonalDataFormValues>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      nickname: "",
      nim: "",
      phone: "",
      birthPlace: "",
      address: "",
      major: "",
      department: "",
      entryYear: new Date().getFullYear(),
      motivation: "",
      experience: "",
      achievement: "",
    },
  });

  // Load existing data
  useEffect(() => {
    async function loadExistingData() {
      if (!user?.uid) return;

      setIsLoadingProfile(true);

      try {
        // Load from user profile
        const userRef = doc(db, "users_new", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const profile = userData.profile || {};

          // Set full name from database (read-only)
          setFullName(profile.fullName || userData.displayName || "");

          form.setValue("nickname", profile.nickname || "");
          form.setValue("nim", profile.nim || "");
          form.setValue("phone", profile.phone || "");
          form.setValue("gender", profile.gender || undefined);
          form.setValue("birthPlace", profile.birthPlace || "");
          form.setValue("address", profile.address || "");
          form.setValue("major", profile.major || "");
          form.setValue("department", profile.department || "");
          form.setValue(
            "entryYear",
            profile.entryYear || new Date().getFullYear(),
          );

          // Pre-select jurusan if exists (using jurusanId or find by name)
          if (profile.jurusanId) {
            setSelectedJurusanId(profile.jurusanId);
          }

          // Handle birthDate
          if (profile.birthDate) {
            const birthDate =
              profile.birthDate.toDate?.() || new Date(profile.birthDate);
            form.setValue("birthDate", birthDate);
          }
        }

        // Load from registration
        if (registration) {
          form.setValue("motivation", registration.motivation || "");
          form.setValue("experience", registration.experience || "");
          form.setValue("achievement", registration.achievement || "");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadExistingData();
  }, [user?.uid, registration, form]);

  // Load jurusan list on mount
  useEffect(() => {
    async function loadJurusan() {
      try {
        const jurusan = await getAllJurusan();
        setJurusanList(jurusan);
      } catch (error) {
        console.error("Error loading jurusan:", error);
      }
    }
    loadJurusan();
  }, []);

  // Load prodi when jurusan changes
  useEffect(() => {
    async function loadProdi() {
      if (!selectedJurusanId) {
        setProdiList([]);
        return;
      }

      setIsLoadingProdi(true);
      try {
        const prodi = await getProdiByJurusan(selectedJurusanId);
        setProdiList(prodi);
      } catch (error) {
        console.error("Error loading prodi:", error);
      } finally {
        setIsLoadingProdi(false);
      }
    }
    loadProdi();
  }, [selectedJurusanId]);

  // Handle jurusan change
  const handleJurusanChange = (jurusanId: string) => {
    const selectedJurusan = jurusanList.find((j) => j.id === jurusanId);
    if (selectedJurusan) {
      setSelectedJurusanId(jurusanId);
      form.setValue("department", selectedJurusan.nama);
      // Reset prodi when jurusan changes
      form.setValue("major", "");
    }
  };

  // Handle prodi change
  const handleProdiChange = (prodiFormattedValue: string) => {
    form.setValue("major", prodiFormattedValue);
  };

  const onSubmit = async (data: PersonalDataFormValues) => {
    try {
      // Include jurusanId for pre-selection on reload
      await updatePersonalData({
        ...data,
        jurusanId: selectedJurusanId,
      });
    } catch (error) {
      console.error("Error saving personal data:", error);
    }
  };

  if (isLoadingProfile) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Data Diri</CardTitle>
        <CardDescription>
          Lengkapi informasi pribadi dan akademik Anda. Pastikan data yang diisi
          sesuai dengan dokumen resmi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name (Read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Nama Lengkap
              </label>
              <Input
                value={fullName}
                disabled
                className="bg-muted cursor-not-allowed"
                placeholder="Nama lengkap dari akun"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Nama lengkap diambil dari data akun Anda dan tidak dapat diubah.
              </p>
            </div>

            {/* Personal Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nickname */}
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Panggilan *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama panggilan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* NIM */}
              <FormField
                control={form.control}
                name="nim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIM *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor Induk Mahasiswa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor HP/WhatsApp *</FormLabel>
                    <FormControl>
                      <Input placeholder="08xxxxxxxxxx" {...field} />
                    </FormControl>
                    <FormDescription>
                      Pastikan nomor aktif untuk dihubungi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis kelamin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Laki-laki</SelectItem>
                        <SelectItem value="female">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Birth Date */}
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Lahir *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "d MMMM yyyy", {
                                locale: localeId,
                              })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1990-01-01")
                          }
                          initialFocus
                          captionLayout="dropdown"
                          fromYear={1990}
                          toYear={new Date().getFullYear()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Birth Place */}
              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir *</FormLabel>
                    <FormControl>
                      <Input placeholder="Kota tempat lahir" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Domisili *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alamat tempat tinggal saat ini"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Academic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Department (Jurusan) - Select first */}
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jurusan *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        handleJurusanChange(value);
                      }}
                      value={selectedJurusanId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jurusan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jurusanList.map((jurusan) => (
                          <SelectItem key={jurusan.id} value={jurusan.id}>
                            {jurusan.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {/* Hidden input to store the actual value */}
                    <input type="hidden" {...field} />
                  </FormItem>
                )}
              />

              {/* Major (Program Studi) - Depends on Jurusan */}
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Studi *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        handleProdiChange(value);
                      }}
                      value={field.value}
                      disabled={!selectedJurusanId || isLoadingProdi}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoadingProdi
                                ? "Memuat..."
                                : !selectedJurusanId
                                  ? "Pilih jurusan dulu"
                                  : "Pilih program studi"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {prodiList.map((prodi) => (
                          <SelectItem
                            key={prodi.id}
                            value={prodi.formattedValue}
                          >
                            {prodi.displayLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entry Year */}
              <FormField
                control={form.control}
                name="entryYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Masuk *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Motivation */}
            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivasi Bergabung dengan UKM Robotik *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan motivasi Anda bergabung dengan UKM Robotik PNP (minimal 50 karakter)"
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/50 karakter (minimal)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Experience */}
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pengalaman Organisasi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ceritakan pengalaman organisasi Anda sebelumnya (opsional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Achievement */}
            <FormField
              control={form.control}
              name="achievement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prestasi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Sebutkan prestasi yang pernah Anda raih (opsional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Simpan & Lanjutkan
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

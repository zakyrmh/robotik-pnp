import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FillDataFormValues } from "@/lib/firebase/services/fill-data-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Jurusan } from "@/types/jurusan-prodi";
import { useMemo } from "react";

interface AcademicDataFormProps {
  formData: FillDataFormValues;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (name: string, value: string) => void;
  jurusanList: Jurusan[];
}

export default function AcademicDataForm({
  formData,
  handleChange,
  handleSelectChange,
  jurusanList,
}: AcademicDataFormProps) {
  const selectedJurusan = useMemo(() => {
    return jurusanList?.find((j) => j.nama === formData.major);
  }, [jurusanList, formData.major]);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle>Data Akademik</CardTitle>
        <CardDescription>
          Informasi kemahasiswaan Anda di Politeknik Negeri Padang.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nim">NIM *</Label>
          <Input
            id="nim"
            name="nim"
            placeholder="Nomor Induk Mahasiswa"
            value={formData.nim}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="major">Jurusan</Label>
          <Select
            name="major"
            value={formData.major}
            onValueChange={(val) => handleSelectChange("major", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Jurusan" />
            </SelectTrigger>
            <SelectContent>
              {jurusanList.map((jurusan) => (
                <SelectItem key={jurusan.nama} value={jurusan.nama}>
                  {jurusan.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Prodi</Label>
          <Select
            name="department"
            value={formData.department}
            onValueChange={(val) => handleSelectChange("department", val)}
            disabled={!formData.major}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Program Studi" />
            </SelectTrigger>
            <SelectContent>
              {selectedJurusan?.program_studi.map((prodi) => (
                <SelectItem
                  key={prodi.nama}
                  value={`${prodi.jenjang} - ${prodi.nama}`}
                >
                  {prodi.jenjang} - {prodi.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entryYear">Tahun Masuk</Label>
          <Input
            id="entryYear"
            name="entryYear"
            type="number"
            placeholder="Tahun Angkatan"
            value={formData.entryYear}
            onChange={handleChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}

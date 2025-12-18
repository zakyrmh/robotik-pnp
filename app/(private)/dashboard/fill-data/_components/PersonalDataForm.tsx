import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FillDataFormValues } from "@/lib/firebase/services/fill-data-service";
import { Gender } from "@/types/enum";

interface PersonalDataFormProps {
  formData: FillDataFormValues;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (name: string, value: string) => void;
}

export default function PersonalDataForm({
  formData,
  handleChange,
  handleSelectChange,
}: PersonalDataFormProps) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle>Data Pribadi</CardTitle>
        <CardDescription>Informasi dasar tentang diri Anda.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nama Lengkap *</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Nama Lengkap sesuai KTM"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">Nama Panggilan</Label>
          <Input
            id="nickname"
            name="nickname"
            placeholder="Nama Panggilan"
            value={formData.nickname}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Jenis Kelamin</Label>
          <Select
            name="gender"
            value={formData.gender}
            onValueChange={(val) => handleSelectChange("gender", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Jenis Kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Gender.MALE}>Laki-laki</SelectItem>
              <SelectItem value={Gender.FEMALE}>Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Nomor WhatsApp *</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="Contoh: 081234567890"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthPlace">Tempat Lahir</Label>
          <Input
            id="birthPlace"
            name="birthPlace"
            placeholder="Kota Kelahiran"
            value={formData.birthPlace}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Tanggal Lahir</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={handleChange}
          />
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
          <Label htmlFor="address">Alamat Domisili</Label>
          <Textarea
            id="address"
            name="address"
            placeholder="Alamat lengkap saat ini"
            value={formData.address}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

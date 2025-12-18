import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FillDataFormValues } from "@/lib/firebase/services/fill-data-service";

interface RegistrationFormProps {
  formData: FillDataFormValues;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

export default function RegistrationForm({
  formData,
  handleChange,
}: RegistrationFormProps) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle>Lembar Pendaftaran</CardTitle>
        <CardDescription>
          Ceritakan tentang diri Anda dan motivasi bergabung.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="motivation">Motivasi Masuk Robotik *</Label>
          <Textarea
            id="motivation"
            name="motivation"
            placeholder="Jelaskan alasan Anda ingin bergabung dengan UKM Robotik..."
            value={formData.motivation}
            onChange={handleChange}
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">
            Pengalaman Organisasi / Lomba (Opsional)
          </Label>
          <Textarea
            id="experience"
            name="experience"
            placeholder="Ceritakan pengalaman organisasi atau lomba yang pernah diikuti..."
            value={formData.experience}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="achievement">Prestasi (Opsional)</Label>
          <Textarea
            id="achievement"
            name="achievement"
            placeholder="Sebutkan prestasi yang pernah diraih..."
            value={formData.achievement}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

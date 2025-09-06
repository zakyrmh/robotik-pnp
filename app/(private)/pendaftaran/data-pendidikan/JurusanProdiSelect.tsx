// components/Pendaftaran/JurusanProdiSelect.tsx
"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataJurusan } from "@/types/jurusan-prodi";

type Props = {
  valueJurusan?: string;
  valueProdi?: string;
  onChangeJurusan?: (val: string) => void;
  onChangeProdi?: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export default function JurusanProdiSelect({
  valueJurusan,
  valueProdi,
  onChangeJurusan,
  onChangeProdi,
  required,
  disabled,
}: Props) {
  const [data, setData] = React.useState<DataJurusan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [localJurusan, setLocalJurusan] = React.useState("");
  const [localProdi, setLocalProdi] = React.useState("");

  React.useEffect(() => {
    fetch("/data/jurusanProdi.json")
      .then((res) => res.json())
      .then((json: DataJurusan) => {
        setData(json);
        setError(null);
      })
      .catch(() => setError("Gagal memuat daftar jurusan"))
      .finally(() => setLoading(false));
  }, []);

  const jurusanTerpilih = valueJurusan ?? localJurusan;
  const prodiTerpilih = valueProdi ?? localProdi;

  const jurusanList = data?.jurusan ?? [];
  const prodiList =
    jurusanList.find((j) => j.nama === jurusanTerpilih)?.program_studi ?? [];

  const handleJurusanChange = (val: string) => {
    if (valueJurusan === undefined) setLocalJurusan(val);
    if (onChangeJurusan) onChangeJurusan(val);

    // reset prodi kalau jurusan berubah
    if (valueProdi === undefined) setLocalProdi("");
    if (onChangeProdi) onChangeProdi("");
  };

  const handleProdiChange = (val: string) => {
    if (valueProdi === undefined) setLocalProdi(val);
    if (onChangeProdi) onChangeProdi(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Select Jurusan */}
      <div className="w-full">
        <Label className="mb-3">Jurusan</Label>
        <Select
          value={jurusanTerpilih}
          onValueChange={handleJurusanChange}
          disabled={disabled || loading || !!error}
          required={required}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loading ? "Memuat jurusan..." : "Pilih Jurusan"} />
          </SelectTrigger>
          <SelectContent>
            {jurusanList.map((j, idx) => (
              <SelectItem key={idx} value={j.nama}>
                {j.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>

      {/* Select Prodi */}
      <div>
        <Label className="mb-3">Program Studi</Label>
        <Select
          value={prodiTerpilih}
          onValueChange={handleProdiChange}
          disabled={disabled || !jurusanTerpilih || prodiList.length === 0}
          required={required}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={jurusanTerpilih ? "Pilih Program Studi" : "Pilih Jurusan dulu"} />
          </SelectTrigger>
          <SelectContent>
            {prodiList.map((p, idx) => (
              <SelectItem key={idx} value={`${p.jenjang} - ${p.nama}`}>
                {p.jenjang} - {p.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {jurusanTerpilih && prodiList.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Tidak ada prodi untuk jurusan ini
          </p>
        )}
      </div>
    </div>
  );
}

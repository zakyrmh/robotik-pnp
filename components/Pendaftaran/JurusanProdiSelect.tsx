// components/JurusanProdiSelect.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Select } from "@/components/FormElements/select"; // sesuaikan path jika perlu
import { DataJurusan } from "@/types/jurusan-prodi";

type Props = {
  className?: string;
  /** Controlled value untuk jurusan: jika diberikan (bukan undefined) maka mode controlled */
  valueJurusan?: string | null;
  /** Controlled value untuk prodi */
  valueProdi?: string | null;
  onChangeJurusan?: (jurusan: string) => void;
  onChangeProdi?: (prodi: string) => void;
  placeholderJurusan?: string;
  placeholderProdi?: string;
  defaultJurusan?: string;
  defaultProdi?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function JurusanProdiSelect({
  valueJurusan,
  valueProdi,
  onChangeJurusan,
  onChangeProdi,
  placeholderJurusan = "Pilih Jurusan",
  placeholderProdi = "Pilih Program Studi",
  defaultJurusan,
  defaultProdi,
  required,
  disabled,
}: Props) {
  const [data, setData] = useState<DataJurusan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // local selected state (used when uncontrolled)
  const [localJurusan, setLocalJurusan] = useState<string | "">(
    defaultJurusan ?? ""
  );
  const [localProdi, setLocalProdi] = useState<string | "">(
    defaultProdi ?? ""
  );

  // Determine which value is currently displayed (respect Select's controlled/uncontrolled behavior)
  const jurusanValueProp =
    valueJurusan !== undefined ? valueJurusan : undefined;
  const prodiValueProp = valueProdi !== undefined ? valueProdi : undefined;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/data/daftar_jurusan_prodi.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: DataJurusan) => {
        if (!mounted) return;
        setData(json);
        setLoadError(null);
      })
      .catch((err: Error) => {
        if (!mounted) return;
        console.error("Gagal load daftar_jurusan_prodi.json:", err);
        setLoadError("Gagal memuat data jurusan");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // opsi jurusan untuk Select
  const jurusanItems = useMemo(() => {
    return data?.jurusan.map((j) => ({ value: j.nama, label: j.nama })) ?? [];
  }, [data]);

  // cari jurusan terpilih dari controlled value atau local state
  const selectedJurusan =
    jurusanValueProp !== undefined ? jurusanValueProp ?? "" : localJurusan;

  // opsi prodi berdasarkan jurusan terpilih
  const prodiItems = useMemo(() => {
    if (!data) return [];
    const jur = data.jurusan.find((j) => j.nama === selectedJurusan);
    if (!jur) return [];
    return jur.program_studi.map((p) => ({
      value: `${p.jenjang} - ${p.nama}`,
      label: `${p.jenjang} - ${p.nama}`
    }));
  }, [data, selectedJurusan]);

  // handlers
  const handleJurusanChange = (val: string) => {
    // reset prodi local saat jurusan berubah (behavior yang umum di form)
    if (valueProdi === undefined) {
      setLocalProdi("");
    } else {
      // jika controlled prodi ada, parent harus meng-handle reset sendiri
    }

    if (valueJurusan === undefined) {
      // uncontrolled mode: simpan lokal
      setLocalJurusan(val);
    }
    if (onChangeJurusan) onChangeJurusan(val);
  };

  const handleProdiChange = (val: string) => {
    if (valueProdi === undefined) {
      setLocalProdi(val);
    }
    if (onChangeProdi) onChangeProdi(val);
  };

  // disabled logika: disabled global atau loading atau error
  const jurusanDisabled = Boolean(disabled || loading || !!loadError);
  const prodiDisabled = Boolean(
    disabled ||
      loading ||
      !!loadError ||
      !selectedJurusan || // tidak bisa pilih prodi kalau belum pilih jurusan
      prodiItems.length === 0
  );

  return (
    <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
      <Select
        className="w-full"
        label="Jurusan"
        items={jurusanItems}
        placeholder={placeholderJurusan}
        required={required}
        disabled={jurusanDisabled}
        // pass value only if parent provided (so Select toggles controlled/uncontrolled)
        {...(jurusanValueProp !== undefined
          ? { value: jurusanValueProp }
          : { defaultValue: defaultJurusan })}
        onChange={(v) => handleJurusanChange(v)}
      />
      {loading && <p className="text-xs text-muted mt-1">Memuat jurusan…</p>}
      {loadError && <p className="text-xs text-red mt-1">{loadError}</p>}

      <Select
        className="w-full"
        label="Program Studi"
        items={prodiItems}
        placeholder={
          selectedJurusan ? placeholderProdi : "Pilih Jurusan Dahulu"
        }
        required={required}
        disabled={prodiDisabled}
        // Jika parent mengontrol prodi => gunakan value dari parent.
        // Jika parent tidak mengontrol, kita kontrol sendiri dengan localProdi.
        {...(prodiValueProp !== undefined
          ? { value: prodiValueProp }
          : { value: localProdi })}
        onChange={(v) => handleProdiChange(v)}
      />
      {!prodiDisabled && prodiItems.length === 0 && (
        <p className="text-xs text-muted mt-1">
          Tidak ada program studi untuk jurusan ini.
        </p>
      )}
    </div>
  );
}

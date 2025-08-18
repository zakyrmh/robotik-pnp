// src/app/page.tsx

'use client'; // <-- Wajib untuk menggunakan state dan event handler

import { useState, FormEvent } from 'react';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setStatus('Silakan pilih file terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setStatus('Mengunggah file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(`Berhasil! File "${result.fileData.name}" telah diunggah.`);
        setFile(null); // Reset input file setelah berhasil
        // Reset form jika Anda menggunakan e.target
        (e.target as HTMLFormElement).reset(); 
      } else {
        setStatus(`Gagal: ${result.message}`);
      }
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      setStatus('Gagal mengunggah file. Lihat konsol untuk detail.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Unggah File ke Google Drive</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} disabled={isLoading} />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Mengunggah...' : 'Unggah File'}
        </button>
      </form>
      {status && <p>{status}</p>}
    </main>
  );
}
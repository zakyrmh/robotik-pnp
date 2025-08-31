"use client";

import { UploadButton } from "@/utils/uploadthing";

export default function UploadPage() {
  return (
    <main>
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          console.log("Upload selesai:", res);
          alert("Heppy Upload!");
        }}
        onUploadError={(err) => {
          alert(`Error: ${err.message}`);
        }}
      />
    </main>
  );
}

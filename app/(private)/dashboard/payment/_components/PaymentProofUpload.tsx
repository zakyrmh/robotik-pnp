import FirebaseStorageImage from "@/components/FirebaseStorageImage";
import { Image as ImageIcon } from "lucide-react";

interface PaymentProofUploadProps {
  previewUrl: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPreview: () => void;
}

export default function PaymentProofUpload({
  previewUrl,
  onFileSelect,
  onClearPreview,
}: PaymentProofUploadProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center dark:bg-green-900/30 dark:text-green-400">
          <ImageIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Bukti Pembayaran
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Unggah screenshot bukti pembayaran dengan ukuran maksimal 2MB
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {previewUrl ? (
          <div className="relative w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <FirebaseStorageImage
              imagePath={previewUrl}
              alt="Bukti Pembayaran"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 448px"
              priority
            />
            <button
              type="button"
              onClick={onClearPreview}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition"
              title="Hapus gambar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ) : null}

        <div>
          <label className="block">
            <span className="sr-only">Pilih bukti pembayaran</span>
            <input
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/30 dark:file:text-green-400"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

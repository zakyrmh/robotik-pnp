import { Loader2, CheckCircle2 } from "lucide-react";

interface UploadProgressModalProps {
  isOpen: boolean;
  uploadSteps: {
    label: string;
    progress: number;
    status: "pending" | "uploading" | "completed";
  }[];
}

export default function UploadProgressModal({
  isOpen,
  uploadSteps,
}: UploadProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Upload Dokumen
        </h2>

        <div className="space-y-4">
          {uploadSteps.map((step, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : step.status === "uploading" ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      step.status === "completed"
                        ? "text-green-600 dark:text-green-400"
                        : step.status === "uploading"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {step.status === "uploading" && (
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {step.progress}%
                  </span>
                )}
              </div>

              {step.status === "uploading" && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {uploadSteps.every((step) => step.status === "completed") && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="text-sm text-green-700 dark:text-green-400 text-center font-medium">
              Semua dokumen berhasil diunggah! <br />
              Menunggu verifikasi dari admin...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

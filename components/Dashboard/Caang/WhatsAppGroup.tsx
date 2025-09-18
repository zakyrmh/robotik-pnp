import { ExternalLink, MessageCircle } from "lucide-react";

export default function WhatsAppGroup() {
  return (
    <div className="mt-8">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Gabung Grup WhatsApp Calon Anggota 21
              </h3>
              <p className="text-green-100 text-sm mb-3">
                Dapatkan info terbaru seputar Open Reqruitment Caang 21
              </p>
              <a
                href="https://chat.whatsapp.com/J822tPx4E4kCMPaDD88RYv?mode=ems_copy_t"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Join Grup WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

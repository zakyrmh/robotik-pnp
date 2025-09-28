'use client'

import { motion } from 'framer-motion'
import { Settings, Wrench, Clock, Mail } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo/Icon dengan animasi rotasi */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="mx-auto w-20 h-20 mb-8"
        >
          <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
            <Settings className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Judul dengan animasi fade in */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4"
        >
          UKM Robotik PNP
        </motion.h1>

        {/* Pesan maintenance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6"
        >
          <div className="flex items-center justify-center mb-4">
            <Wrench className="w-6 h-6 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Sedang Maintenance</h2>
          </div>
          
          <p className="text-gray-300 mb-4">
            Website sedang dalam proses pemeliharaan untuk memberikan pengalaman yang lebih baik.
          </p>

          <div className="flex items-center justify-center text-sm text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            <span>Estimasi selesai: 1-2 hari</span>
          </div>
        </motion.div>

        {/* Kontak info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-gray-400 text-sm mb-3">
            Untuk informasi urgent, hubungi kami:
          </p>
          <div className="flex items-center justify-center">
            <Mail className="w-4 h-4 text-blue-400 mr-2" />
            <a 
              href="mailto:infokomrobotikpnp2024@gmail.com" 
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm"
            >
              infokomrobotikpnp2024@gmail.com
            </a>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 pt-6 border-t border-white/20"
        >
          <p className="text-gray-500 text-xs">
            © 2025 UKM Robotik Politeknik Negeri Padang
          </p>
        </motion.footer>
      </div>
    </div>
  )
}
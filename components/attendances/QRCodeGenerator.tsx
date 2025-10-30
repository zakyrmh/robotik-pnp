'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity } from '@/types/activities';
import { Attendance } from '@/types/attendances';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QRCode from 'react-qr-code';
import { 
  QrCode, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  doc, 
  getDoc, 
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { generateSHA256Hash } from '@/utils/cryptoUtils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface QRCodeGeneratorProps {
  activity: Activity;
  userId: string;
}

interface QRData {
  encryptedData: string;
  expiresAt: Date;
}

export default function QRCodeGenerator({ activity, userId }: QRCodeGeneratorProps) {
  const [qrCodeData, setQrCodeData] = useState<QRData | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [windowCountdown, setWindowCountdown] = useState<{ type: 'open' | 'close', seconds: number } | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location permission denied:', error);
        }
      );
    }
  }, []);

  // Check if attendance window is open
  const isAttendanceOpen = useCallback(() => {
    const now = new Date();
    const openTime = activity.attendanceOpenTime?.toDate();
    const closeTime = activity.attendanceCloseTime?.toDate();
    
    if (!openTime || !closeTime) return false;
    
    return now >= openTime && now <= closeTime;
  }, [activity]);

  // Calculate countdown for attendance window
  useEffect(() => {
    const calculateWindowCountdown = () => {
      const now = new Date();
      const openTime = activity.attendanceOpenTime?.toDate();
      const closeTime = activity.attendanceCloseTime?.toDate();
      
      if (!openTime || !closeTime) return;
      
      if (now < openTime) {
        const diff = Math.floor((openTime.getTime() - now.getTime()) / 1000);
        setWindowCountdown({ type: 'open', seconds: diff });
      } else if (now >= openTime && now <= closeTime) {
        const diff = Math.floor((closeTime.getTime() - now.getTime()) / 1000);
        setWindowCountdown({ type: 'close', seconds: diff });
      } else {
        setWindowCountdown(null);
      }
    };

    calculateWindowCountdown();
    const interval = setInterval(calculateWindowCountdown, 1000);
    return () => clearInterval(interval);
  }, [activity]);

  // Load existing Attendance and check localStorage for QR
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check attendance first
        const attendanceId = `${activity.id}_${userId}`;
        const attendanceDoc = await getDoc(doc(db, 'attendances', attendanceId));
        
        if (attendanceDoc.exists()) {
          setAttendance({ id: attendanceDoc.id, ...attendanceDoc.data() } as Attendance);
          setLoading(false);
          return;
        }
        
        // Check active QR Code from localStorage
        const storedQR = localStorage.getItem(`qr_${activity.id}_${userId}`);
        if (storedQR) {
          try {
            const qrData = JSON.parse(storedQR);
            const now = new Date();
            const expiresAt = new Date(qrData.expiresAt);
            
            if (now < expiresAt) {
              setQrCodeData(qrData);
            } else {
              localStorage.removeItem(`qr_${activity.id}_${userId}`);
            }
          } catch (err) {
            console.error('Error parsing QR data:', err);
            localStorage.removeItem(`qr_${activity.id}_${userId}`);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Gagal memuat data');
        setLoading(false);
      }
    };

    loadData();
  }, [activity.id, userId]);

  // Listen to attendance changes (real-time)
  useEffect(() => {
    const attendanceId = `${activity.id}_${userId}`;
    const unsubscribe = onSnapshot(
      doc(db, 'attendances', attendanceId),
      (doc) => {
        if (doc.exists()) {
          setAttendance({ id: doc.id, ...doc.data() } as Attendance);
          // Clear QR Code when attendance is created
          setQrCodeData(null);
          localStorage.removeItem(`qr_${activity.id}_${userId}`);
        }
      }
    );

    return () => unsubscribe();
  }, [activity.id, userId]);

  // QR Code expiry countdown
  useEffect(() => {
    if (!qrCodeData) return;

    const calculateCountdown = () => {
      const now = new Date();
      const expiresAt = qrCodeData.expiresAt;
      const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      
      if (diff <= 0) {
        setQrCodeData(null);
        localStorage.removeItem(`qr_${activity.id}_${userId}`);
        setCountdown(0);
      } else {
        setCountdown(diff);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [qrCodeData, activity.id, userId]);

  // Generate QR Code (without database)
  const generateQRCode = async () => {
    if (!isAttendanceOpen()) {
      setError('Waktu absensi belum dibuka atau sudah ditutup');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
      const expiryTimestamp = expiresAt.getTime();

      // Create QR data: userId_activityId_timestamp
      const rawData = `${userId}_${activity.id}_${expiryTimestamp}`;
      
      // Generate hash for security
      const hash = await generateSHA256Hash(rawData);
      
      // Encrypt data: combine rawData with hash
      const encryptedData = btoa(`${rawData}_${hash}`); // Base64 encode

      const newQRData: QRData = {
        encryptedData,
        expiresAt,
      };

      // Save to localStorage only
      localStorage.setItem(`qr_${activity.id}_${userId}`, JSON.stringify(newQRData));

      setQrCodeData(newQRData);
      setGenerating(false);
    } catch (err) {
      console.error('Error generating QR Code:', err);
      setError('Gagal membuat QR Code. Silakan coba lagi.');
      setGenerating(false);
    }
  };

  // Format time
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatWindowCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours} jam ${mins} menit`;
    } else if (mins > 0) {
      return `${mins} menit ${secs} detik`;
    } else {
      return `${secs} detik`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  // Already attended
  if (attendance) {
    const checkedInTime = attendance.checkedInAt?.toDate();
    const statusText = attendance.status === 'present' ? 'Hadir' : 
                       attendance.status === 'late' ? 'Terlambat' : 
                       attendance.status === 'excused' ? 'Izin' :
                       attendance.status === 'sick' ? 'Sakit' : 'Tidak Hadir';
    
    const statusColor = attendance.status === 'present' ? 'text-green-600 dark:text-green-400' : 
                        attendance.status === 'late' ? 'text-orange-600 dark:text-orange-400' : 
                        'text-blue-600 dark:text-blue-400';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-6 w-6" />
              Absensi Berhasil
            </CardTitle>
            <CardDescription>
              Anda telah melakukan absensi untuk aktivitas ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status Kehadiran</p>
                <p className={`font-bold text-lg ${statusColor}`}>{statusText}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waktu Absensi</p>
                <p className="font-medium">
                  {checkedInTime ? format(checkedInTime, 'HH:mm, dd MMM yyyy', { locale: id }) : '-'}
                </p>
              </div>
            </div>
            {location && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Lokasi: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Attendance window not open yet
  if (windowCountdown && windowCountdown.type === 'open') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Absensi Belum Dibuka
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Absensi akan dibuka dalam <span className="font-bold">{formatWindowCountdown(windowCountdown.seconds)}</span>
            </AlertDescription>
          </Alert>
          <div className="text-sm text-muted-foreground">
            <p>Waktu buka absensi:</p>
            <p className="font-medium text-foreground">
              {activity.attendanceOpenTime && format(activity.attendanceOpenTime.toDate(), 'HH:mm, dd MMMM yyyy', { locale: id })}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Attendance window closed
  if (!isAttendanceOpen() && (!windowCountdown || windowCountdown.type !== 'close')) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Absensi Ditutup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Waktu absensi telah berakhir. Anda tidak dapat melakukan absensi lagi.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Active QR Code
  if (qrCodeData && countdown > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                QR Code Absensi
              </span>
              <Badge variant="outline" className="text-lg font-mono">
                {formatCountdown(countdown)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Tunjukkan QR Code ini kepada admin untuk melakukan absensi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Code Display */}
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCode
                value={qrCodeData.encryptedData}
                size={256}
                level="H"
              />
            </div>

            {/* Countdown Warning */}
            {countdown <= 60 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  QR Code akan expired dalam {countdown} detik!
                </AlertDescription>
              </Alert>
            )}

            {/* Window Countdown */}
            {windowCountdown && windowCountdown.type === 'close' && (
              <div className="text-sm text-muted-foreground text-center">
                Waktu absensi ditutup dalam: <span className="font-medium">{formatWindowCountdown(windowCountdown.seconds)}</span>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              QR Code akan otomatis expired setelah 5 menit
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Generate QR Code Button
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Generate QR Code
        </CardTitle>
        <CardDescription>
          Buat QR Code untuk melakukan absensi aktivitas ini
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Window Countdown */}
        {windowCountdown && windowCountdown.type === 'close' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Waktu absensi ditutup dalam <span className="font-bold">{formatWindowCountdown(windowCountdown.seconds)}</span>
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={() => generateQRCode()} 
          disabled={generating || !isAttendanceOpen()}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Membuat QR Code...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-5 w-5" />
              Generate QR Code
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          QR Code akan valid selama 5 menit setelah dibuat
        </p>
      </CardContent>
    </Card>
  );
}
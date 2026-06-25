export type TabType = 'mekanik' | 'elektronik' | 'software'

export interface TechSpec {
  id: string
  title: string
  items: {
    label: string
    description: string
  }[]
}

export interface TeamMember {
  id: string
  name: string
  role: string
  image: string
}

export interface GalleryItem {
  id: string
  type: 'image' | 'video'
  url: string
  caption: string
}

export interface DivisionStaticData {
  slug: string
  hero: {
    badge: string
    title: string
    subtitle: string
    image: string
  }
  specs: Record<TabType, TechSpec>
  team: TeamMember[]
  gallery: GalleryItem[]
}

export const divisionsData: Record<string, DivisionStaticData> = {
  krai: {
    slug: 'krai',
    hero: {
      badge: 'Kontes Robot ABU Indonesia (KRAI)',
      title: 'KRAI',
      subtitle: 'Divisi riset yang berfokus pada pengembangan robot otomatis dan manual berskala besar untuk menaklukkan tantangan tematik ABU Robocon dengan presisi dan kecepatan tinggi.',
      image: '/images/krai-hero.jpg', // Placeholder
    },
    specs: {
      mekanik: {
        id: 'mekanik',
        title: 'Mekanik & Hardware',
        items: [
          { label: 'Sistem Aktuator', description: 'Motor BLDC Torsi Tinggi dengan sistem transmisi planetary gear.' },
          { label: 'Sasis & Bodi', description: 'Rangka Aluminium Profile kokoh dengan sistem pneumatik pelempar.' },
          { label: 'Sistem Daya', description: 'Manajemen baterai LiPo 6S dengan distribusi daya tersentralisasi.' },
        ],
      },
      elektronik: {
        id: 'elektronik',
        title: 'Elektronik & Sensor',
        items: [
          { label: 'Komputasi Utama', description: 'STM32 Nucleo Board dipadukan dengan Mini PC untuk pemrosesan gambar.' },
          { label: 'Sistem Sensor', description: 'LiDAR 2D untuk lokalisasi, rotary encoder presisi tinggi, dan sensor jarak ToF.' },
          { label: 'Sirkuit Kendali', description: 'Custom Mainboard PCB dengan sistem isolasi optocoupler untuk keamanan.' },
        ],
      },
      software: {
        id: 'software',
        title: 'Software & AI',
        items: [
          { label: 'Framework & OS', description: 'Robot Operating System (ROS) 2 pada sistem berbasis Linux.' },
          { label: 'Modul Visi Komputer', description: 'Sistem pelacakan objek presisi tinggi berbasis OpenCV.' },
          { label: 'Logika Strategi', description: 'Algoritma Path Planning cerdas untuk pergerakan otomatis yang efisien.' },
        ],
      },
    },
    team: [
      { id: '1', name: 'Ahmad Fauzi', role: 'Ketua Divisi', image: '/images/team-placeholder.jpg' },
      { id: '2', name: 'Budi Santoso', role: 'Tim Software', image: '/images/team-placeholder.jpg' },
      { id: '3', name: 'Citra Kirana', role: 'Tim Elektrikal', image: '/images/team-placeholder.jpg' },
      { id: '4', name: 'Dewi Lestari', role: 'Tim Mekanik', image: '/images/team-placeholder.jpg' },
    ],
    gallery: [
      { id: '1', type: 'image', url: '/images/gallery-placeholder-1.jpg', caption: 'Kalibrasi Sensor LiDAR' },
      { id: '2', type: 'video', url: '/videos/test-run.mp4', caption: 'Uji Coba Pergerakan Otonom' },
      { id: '3', type: 'image', url: '/images/gallery-placeholder-2.jpg', caption: 'Perakitan Sasis Utama' },
    ],
  },
  'krsbi-b': {
    slug: 'krsbi-b',
    hero: {
      badge: 'Kontes Robot Sepak Bola Indonesia Beroda (KRSBI-B)',
      title: 'KRSBI-BERODA',
      subtitle: 'Divisi riset yang berfokus pada pengembangan robot otonom beroda berkemampuan mobilitas tinggi untuk mensimulasikan permainan sepak bola secara cerdas dan taktis.',
      image: '/images/krsbi-b-hero.jpg', // Placeholder
    },
    specs: {
      mekanik: {
        id: 'mekanik',
        title: 'Mekanik & Hardware',
        items: [
          { label: 'Sistem Aktuator', description: 'Omnidirectional Wheels dengan 3 atau 4 roda untuk mobilitas segala arah.' },
          { label: 'Sasis & Bodi', description: 'Aluminium Alloy cutting ringan namun tahan benturan keras.' },
          { label: 'Sistem Daya', description: 'Manajemen energi LiPo berkapasitas tinggi untuk durasi pertandingan penuh.' },
        ],
      },
      elektronik: {
        id: 'elektronik',
        title: 'Elektronik & Sensor',
        items: [
          { label: 'Komputasi Utama', description: 'Mini PC terintegrasi dengan mikrokontroler STM32 untuk kontrol motor.' },
          { label: 'Sistem Sensor', description: 'Kamera Omnidirectional (Vision) dan Sensor Kecepatan IMU.' },
          { label: 'Sirkuit Kendali', description: 'Custom PCB berlapis dengan perlindungan lonjakan tegangan.' },
        ],
      },
      software: {
        id: 'software',
        title: 'Software & AI',
        items: [
          { label: 'Framework & OS', description: 'ROS 2 untuk komunikasi node yang asinkron.' },
          { label: 'Modul Visi Komputer', description: 'Deteksi bola dan gawang secara real-time menggunakan YOLO.' },
          { label: 'Logika Strategi', description: 'Algoritma penentu keputusan multi-agent untuk formasi tim dinamis.' },
        ],
      },
    },
    team: [
      { id: '1', name: 'Eko Prasetyo', role: 'Ketua Divisi', image: '/images/team-placeholder.jpg' },
      { id: '2', name: 'Fajar Nugroho', role: 'Tim Software', image: '/images/team-placeholder.jpg' },
      { id: '3', name: 'Gita Pertiwi', role: 'Tim Elektrikal', image: '/images/team-placeholder.jpg' },
      { id: '4', name: 'Hadi Gunawan', role: 'Tim Mekanik', image: '/images/team-placeholder.jpg' },
    ],
    gallery: [
      { id: '1', type: 'image', url: '/images/gallery-placeholder-1.jpg', caption: 'Kalibrasi Kamera Omnidirectional' },
      { id: '2', type: 'video', url: '/videos/test-run.mp4', caption: 'Simulasi Tendangan Penalti' },
      { id: '3', type: 'image', url: '/images/gallery-placeholder-2.jpg', caption: 'Penyetelan Algoritma Visi' },
    ],
  },
  'krsbi-h': {
    slug: 'krsbi-h',
    hero: {
      badge: 'Kontes Robot Sepak Bola Indonesia Humanoid (KRSBI-H)',
      title: 'KRSBI-HUMANOID',
      subtitle: 'Divisi riset yang mengembangkan robot bipedal humanoid yang mampu berjalan, menendang bola, dan mendeteksi lingkungan sekitarnya dengan algoritma AI mutakhir.',
      image: '/images/krsbi-h-hero.jpg', // Placeholder
    },
    specs: {
      mekanik: {
        id: 'mekanik',
        title: 'Mekanik & Hardware',
        items: [
          { label: 'Sistem Aktuator', description: 'Smart Servo berkinerja tinggi untuk pergerakan sendi yang presisi.' },
          { label: 'Sasis & Bodi', description: 'Struktur rangka aluminium ringan yang didesain khusus untuk robot bipedal.' },
          { label: 'Sistem Daya', description: 'Sistem baterai polimer litium yang kompak dengan power board efisien.' },
        ],
      },
      elektronik: {
        id: 'elektronik',
        title: 'Elektronik & Sensor',
        items: [
          { label: 'Komputasi Utama', description: 'SBC (Single Board Computer) kuat terhubung ke sub-kontroler servo.' },
          { label: 'Sistem Sensor', description: 'Kamera HD di bagian kepala, serta IMU (Inertial Measurement Unit) 6-DOF.' },
          { label: 'Sirkuit Kendali', description: 'Papan distribusi daya cerdas dan bus komunikasi RS485 untuk servo.' },
        ],
      },
      software: {
        id: 'software',
        title: 'Software & AI',
        items: [
          { label: 'Framework & OS', description: 'Linux dipadukan dengan framework robotik kustom atau ROS.' },
          { label: 'Modul Visi Komputer', description: 'Pemrosesan citra tertanam untuk pendeteksian bola, garis, dan lawan.' },
          { label: 'Logika Strategi', description: 'Generator pola berjalan dinamis (Walk Engine) dan mesin keadaan (State Machine).' },
        ],
      },
    },
    team: [
      { id: '1', name: 'Indra Hermawan', role: 'Ketua Divisi', image: '/images/team-placeholder.jpg' },
      { id: '2', name: 'Joko Widodo', role: 'Tim Software', image: '/images/team-placeholder.jpg' },
      { id: '3', name: 'Kartika Sari', role: 'Tim Elektrikal', image: '/images/team-placeholder.jpg' },
      { id: '4', name: 'Lukman Hakim', role: 'Tim Mekanik', image: '/images/team-placeholder.jpg' },
    ],
    gallery: [
      { id: '1', type: 'image', url: '/images/gallery-placeholder-1.jpg', caption: 'Penyesuaian Keseimbangan Bipedal' },
      { id: '2', type: 'video', url: '/videos/test-run.mp4', caption: 'Uji Coba Berjalan di Karpet Hijau' },
      { id: '3', type: 'image', url: '/images/gallery-placeholder-2.jpg', caption: 'Perakitan Servo Sendi Kaki' },
    ],
  },
  'krsti': {
    slug: 'krsti',
    hero: {
      badge: 'Kontes Robot Seni Tari Indonesia (KRSTI)',
      title: 'KRSTI',
      subtitle: 'Divisi riset yang menggabungkan keindahan seni tari budaya Nusantara dengan kecerdasan robotika humanoid bipedal.',
      image: '/images/krsti-hero.jpg', // Placeholder
    },
    specs: {
      mekanik: {
        id: 'mekanik',
        title: 'Mekanik & Hardware',
        items: [
          { label: 'Sistem Aktuator', description: 'Servo digital multi-axis untuk keluwesan gerak tangan dan kaki.' },
          { label: 'Sasis & Bodi', description: 'Rangka bipedal presisi dengan kostum tarian daerah yang dirancang proporsional.' },
          { label: 'Sistem Daya', description: 'Baterai ringan dan sistem stabilisasi tegangan.' },
        ],
      },
      elektronik: {
        id: 'elektronik',
        title: 'Elektronik & Sensor',
        items: [
          { label: 'Komputasi Utama', description: 'Mikrokontroler ARM Cortex-M Series untuk manajemen gerakan.' },
          { label: 'Sistem Sensor', description: 'Sensor suara untuk mendeteksi ritme musik pengiring.' },
          { label: 'Sirkuit Kendali', description: 'Sistem kendali terpusat untuk sinkronisasi gerakan sepasang robot.' },
        ],
      },
      software: {
        id: 'software',
        title: 'Software & AI',
        items: [
          { label: 'Framework & OS', description: 'Sistem RTOS untuk pengaturan waktu gerakan secara presisi.' },
          { label: 'Modul Visi Komputer', description: 'Sensor akustik dan pemrosesan sinyal digital untuk merespons ketukan.' },
          { label: 'Logika Strategi', description: 'Pemetaan gerakan (Motion capture) tari tradisional menjadi sequence servo.' },
        ],
      },
    },
    team: [
      { id: '1', name: 'Mela Rosiana', role: 'Ketua Divisi', image: '/images/team-placeholder.jpg' },
      { id: '2', name: 'Nanda Pratama', role: 'Tim Software', image: '/images/team-placeholder.jpg' },
      { id: '3', name: 'Okta Viani', role: 'Tim Elektrikal', image: '/images/team-placeholder.jpg' },
      { id: '4', name: 'Panji Gumilang', role: 'Tim Mekanik', image: '/images/team-placeholder.jpg' },
    ],
    gallery: [
      { id: '1', type: 'image', url: '/images/gallery-placeholder-1.jpg', caption: 'Desain Kostum Tari Robot' },
      { id: '2', type: 'video', url: '/videos/test-run.mp4', caption: 'Latihan Sinkronisasi Musik' },
      { id: '3', type: 'image', url: '/images/gallery-placeholder-2.jpg', caption: 'Kalibrasi Servo Lengan' },
    ],
  },
  'krsri': {
    slug: 'krsri',
    hero: {
      badge: 'Kontes Robot SAR Indonesia (KRSRI)',
      title: 'KRSRI',
      subtitle: 'Divisi riset yang berfokus pada robot pencari dan penyelamat berkaki (legged robot) yang adaptif di berbagai rintangan medan bencana.',
      image: '/images/krsri-hero.jpg', // Placeholder
    },
    specs: {
      mekanik: {
        id: 'mekanik',
        title: 'Mekanik & Hardware',
        items: [
          { label: 'Sistem Aktuator', description: 'Servo torsi tinggi untuk robot berkaki empat (Quadruped) atau lebih.' },
          { label: 'Sasis & Bodi', description: 'Konstruksi polimer komposit yang kuat dan tahan banting terhadap rintangan.' },
          { label: 'Sistem Daya', description: 'Distribusi daya independen antar kaki untuk mencegah kegagalan sistem.' },
        ],
      },
      elektronik: {
        id: 'elektronik',
        title: 'Elektronik & Sensor',
        items: [
          { label: 'Komputasi Utama', description: 'Sistem multi-mikrokontroler atau SBC terintegrasi.' },
          { label: 'Sistem Sensor', description: 'Sensor api (Flame sensor), sensor jarak, sensor kemiringan, dan sensor suhu.' },
          { label: 'Sirkuit Kendali', description: 'Modul sensor custom dan papan power regulator untuk keadaan darurat.' },
        ],
      },
      software: {
        id: 'software',
        title: 'Software & AI',
        items: [
          { label: 'Framework & OS', description: 'Arsitektur kontrol perilaku (Behavior-based control) kustom.' },
          { label: 'Modul Visi Komputer', description: 'Pemrosesan data sensor fusi untuk pemetaan ruangan (SLAM).' },
          { label: 'Logika Strategi', description: 'Algoritma Inverse Kinematics (IK) untuk adaptasi langkah di permukaan tak rata.' },
        ],
      },
    },
    team: [
      { id: '1', name: 'Qori Akbar', role: 'Ketua Divisi', image: '/images/team-placeholder.jpg' },
      { id: '2', name: 'Rini Yulianti', role: 'Tim Software', image: '/images/team-placeholder.jpg' },
      { id: '3', name: 'Surya Dharma', role: 'Tim Elektrikal', image: '/images/team-placeholder.jpg' },
      { id: '4', name: 'Toni Hidayat', role: 'Tim Mekanik', image: '/images/team-placeholder.jpg' },
    ],
    gallery: [
      { id: '1', type: 'image', url: '/images/gallery-placeholder-1.jpg', caption: 'Uji Jalan di Puing-puing' },
      { id: '2', type: 'video', url: '/videos/test-run.mp4', caption: 'Simulasi Pemadaman Titik Api' },
      { id: '3', type: 'image', url: '/images/gallery-placeholder-2.jpg', caption: 'Penyusunan Modul Sensor Jarak' },
    ],
  },
}

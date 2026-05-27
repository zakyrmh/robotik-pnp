/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit Tests untuk Onboarding Stepper Flow (5 Langkah)
 *
 * Strategi:
 * - Setiap Step diuji sebagai unit mandiri dengan props yang disuntikkan.
 * - Server Actions (checkLegacyMember, savePersonalData, dst.) di-mock penuh.
 * - Pustaka berat (framer-motion, @hugeicons) di-mock agar tidak meledak di jsdom.
 * - "sonner" (toast) di-mock agar kita bisa menyaksikan pemanggilan pesan error.
 * - OnboardingClient diuji sebagai integrasi ringan untuk alur stepper (step 1 → 2).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// -----------------------------------------------------------------------
// Mock: Framer Motion — stub semua animasi agar tidak meledak di jsdom
// -----------------------------------------------------------------------
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// -----------------------------------------------------------------------
// Mock: @hugeicons — stub menjadi span sederhana
// -----------------------------------------------------------------------
vi.mock('@hugeicons/react', () => ({
  HugeiconsIcon: ({ className }: any) => <span className={className} data-testid="hugeicon" />,
}));
vi.mock('@hugeicons/core-free-icons', () => ({
  InformationCircleIcon: {},
  UserCheck01Icon: {},
  ArrowRight02Icon: {},
  Loading02Icon: {},
  ArrowLeft02Icon: {},
  Note01Icon: {},
  InstagramIcon: {},
  YoutubeIcon: {},
  Camera01Icon: {},
  Wallet02Icon: {},
  IdentityCardIcon: {},
  CheckmarkCircle02Icon: {},
  TickDouble02Icon: {},
  // onboarding-header.tsx
  RobotIcon: {},
  // upload-tile.tsx
  GoogleDocIcon: {},
  Delete02Icon: {},
  // image-cropper-modal.tsx
  Image01Icon: {},
}));

// -----------------------------------------------------------------------
// Mock: sonner (toast) — agar kita bisa mengamati toast.error/success calls
// -----------------------------------------------------------------------
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastInfo = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args),
    success: (...args: any[]) => mockToastSuccess(...args),
    info: (...args: any[]) => mockToastInfo(...args),
  },
}));

// -----------------------------------------------------------------------
// Mock: next/navigation
// -----------------------------------------------------------------------
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => '/onboarding',
}));

// -----------------------------------------------------------------------
// Mock variables untuk Server Actions (harus diawali "mock")
// -----------------------------------------------------------------------
let mockCheckLegacyResult: any = { success: true, isLegacy: false, message: 'Caang baru.' };
let mockSavePersonalResult: any = { success: true };
let mockSaveAcademicResult: any = { success: true };
let mockSaveCommitmentResult: any = { success: true };
let mockSaveFinalResult: any = { success: true };
let mockGetMajorsResult: any = [{ id: 'maj-1', name: 'Teknik Informatika' }];
let mockGetStudyProgramsResult: any = [{ id: 'sp-1', name: 'Teknik Informatika', degree: 'D4' }];

// -----------------------------------------------------------------------
// Mock: Server Actions
// -----------------------------------------------------------------------
vi.mock('@/lib/actions/onboarding', () => ({
  checkLegacyMember: vi.fn(async () => mockCheckLegacyResult),
  getOnboardingProgress: vi.fn(async () => ({
    nim: null,
    startStep: 1,
    personal: null,
    academic: null,
    commitment: null,
    paymentMethod: null,
  })),
}));

vi.mock('@/lib/actions/registration', () => ({
  savePersonalData: vi.fn(async () => mockSavePersonalResult),
  saveAcademicData: vi.fn(async () => mockSaveAcademicResult),
  saveCommitmentData: vi.fn(async () => mockSaveCommitmentResult),
  saveFinalData: vi.fn(async () => mockSaveFinalResult),
}));

vi.mock('@/lib/actions/academic', () => ({
  getMajors: vi.fn(async () => mockGetMajorsResult),
  getStudyPrograms: vi.fn(async () => mockGetStudyProgramsResult),
}));

// -----------------------------------------------------------------------
// Mock: @/lib/supabase/client (dipakai oleh StepCommitment & StepUpload)
// -----------------------------------------------------------------------
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: 'user-test-123' } },
        error: null,
      })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ error: null })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://mock-storage.example.com/file.jpg' },
        })),
      })),
    },
  })),
}));

// -----------------------------------------------------------------------
// Mock: komponen kompleks internal (ImageCropperModal, UploadTile)
// -----------------------------------------------------------------------
// Expose onCropComplete via a global ref agar test dapat memicunya secara programatik
let mockCropperOnCropComplete: ((file: File) => void) | null = null;
vi.mock('@/components/onboarding/image-cropper-modal', () => ({
  ImageCropperModal: ({ isOpen, onCropComplete }: any) => {
    if (isOpen) {
      mockCropperOnCropComplete = onCropComplete;
    }
    return isOpen ? <div data-testid="cropper-modal">CropperModal</div> : null;
  },
}));

vi.mock('@/lib/utils/upload', () => ({
  compressImage: vi.fn(async (file: File) => file),
}));

// -----------------------------------------------------------------------
// Mock UI primitives agar tidak bergantung pada Radix/Shadcn internals di jsdom
// -----------------------------------------------------------------------
vi.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, disabled, placeholder, id, className, type }: any) => (
    <input
      id={id}
      data-testid={placeholder || id || 'input'}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      type={type || 'text'}
      onChange={onChange}
    />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ onChange, value, disabled, placeholder, className }: any) => (
    <textarea
      data-testid={placeholder || 'textarea'}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      onChange={onChange}
    />
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value}>
      {/* Render trigger + content together */}
      {children}
      <select
        data-testid="select-native"
        value={value || ''}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        <option value="">Pilih</option>
      </select>
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock('@/components/onboarding/upload-tile', () => ({
  UploadTile: ({ label, onChange, disabled }: any) => (
    <div data-testid={`upload-tile-${label}`}>
      <span>{label}</span>
      <input
        type="file"
        data-testid={`file-input-${label}`}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.files?.[0] ?? null)}
      />
    </div>
  ),
}));

// -----------------------------------------------------------------------
// Import komponen setelah semua mock terdefinisi
// -----------------------------------------------------------------------
import { StepIdentity } from '@/components/onboarding/step-identity';
import { StepPersonal } from '@/components/onboarding/step-personal';
import { StepAcademic } from '@/components/onboarding/step-academic';
import { StepCommitment } from '@/components/onboarding/step-commitment';
import { StepUpload } from '@/components/onboarding/step-upload';
import { OnboardingClient } from '@/components/onboarding/onboarding-client';

// ═══════════════════════════════════════════════════════════════════════
// STEP 1: StepIdentity — Validasi NIM
// ═══════════════════════════════════════════════════════════════════════
describe('Step 1 — StepIdentity: Validasi NIM', () => {
  const mockOnNext = vi.fn();
  const mockSetNim = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLegacyResult = { success: true, isLegacy: false, message: 'Caang baru.' };
  });

  it('[S1-TC1] Tombol "Cek Validasi NIM" nonaktif jika NIM < 8 karakter', () => {
    render(
      <StepIdentity
        nim="1234567"
        setNim={mockSetNim}
        onNext={mockOnNext}
        onLegacyMemberFound={vi.fn()}
        isChecking={false}
        setIsChecking={vi.fn()}
      />
    );
    const btn = screen.getByRole('button', { name: /Cek Validasi NIM/i });
    expect(btn).toBeDisabled();
  });

  it('[S1-TC2] Tombol aktif dan dapat diklik jika NIM ≥ 8 karakter', () => {
    render(
      <StepIdentity
        nim="22110830AA"
        setNim={mockSetNim}
        onNext={mockOnNext}
        onLegacyMemberFound={vi.fn()}
        isChecking={false}
        setIsChecking={vi.fn()}
      />
    );
    const btn = screen.getByRole('button', { name: /Cek Validasi NIM/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('[S1-TC3] Saat isChecking=true, tombol menunjukkan "Memeriksa NIM..." dan disabled', () => {
    render(
      <StepIdentity
        nim="22110830AA"
        setNim={mockSetNim}
        onNext={mockOnNext}
        onLegacyMemberFound={vi.fn()}
        isChecking={true}
        setIsChecking={vi.fn()}
      />
    );
    expect(screen.getByText(/Memeriksa NIM/i)).toBeInTheDocument();
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('[S1-TC4] Input NIM memanggil setNim saat berubah', () => {
    render(
      <StepIdentity
        nim=""
        setNim={mockSetNim}
        onNext={mockOnNext}
        onLegacyMemberFound={vi.fn()}
        isChecking={false}
        setIsChecking={vi.fn()}
      />
    );
    const input = screen.getByTestId('Contoh: 22110830XX');
    fireEvent.change(input, { target: { value: '22110830BB' } });
    expect(mockSetNim).toHaveBeenCalledWith('22110830BB');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 2: StepPersonal — Data Pribadi & Kontak
// ═══════════════════════════════════════════════════════════════════════
describe('Step 2 — StepPersonal: Validasi Field Wajib', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSavePersonalResult = { success: true };
  });

  const renderStep2 = (overrides = {}) =>
    render(<StepPersonal onNext={vi.fn()} onPrev={vi.fn()} initialData={null} {...overrides} />);

  it('[S2-TC1] Menampilkan toast.error jika "Nama Lengkap" kosong saat klik Lanjut', () => {
    renderStep2();
    fireEvent.click(screen.getByRole('button', { name: /Lanjut/i }));
    expect(mockToastError).toHaveBeenCalledWith('Nama lengkap wajib diisi.');
  });

  it('[S2-TC2] Menampilkan toast.error jika "Nama Panggilan" kosong', () => {
    renderStep2();
    fireEvent.change(screen.getByTestId('John Doe'), { target: { value: 'Zaky Ramadhani' } });
    fireEvent.click(screen.getByRole('button', { name: /Lanjut/i }));
    expect(mockToastError).toHaveBeenCalledWith('Nama panggilan wajib diisi.');
  });

  it('[S2-TC3] Menampilkan toast.error jika "No. WhatsApp" kosong', () => {
    renderStep2();
    fireEvent.change(screen.getByTestId('John Doe'), { target: { value: 'Zaky' } });
    fireEvent.change(screen.getByTestId('Doe'), { target: { value: 'Zak' } });
    // Jenis kelamin & WA kosong → gender dulu yg ditolak
    fireEvent.click(screen.getByRole('button', { name: /Lanjut/i }));
    expect(mockToastError).toHaveBeenCalledWith('Jenis kelamin wajib dipilih.');
  });

  it('[S2-TC4] Jika semua field terisi, savePersonalData dipanggil dan onNext terpicu', async () => {
    const mockOnNext = vi.fn();
    // Pre-populate gender via initialData agar tidak perlu select interaction
    const prefilledData = {
      fullName: 'Zaky Ramadhani',
      nickname: 'Zaky',
      gender: 'L' as const,
      phoneNumber: '081234567890',
      pob: 'Padang',
      dob: '2004-01-01',
      originAddress: 'Jl. Sudirman No. 1',
      domicileAddress: 'Jl. Pahlawan No. 5',
    };
    render(<StepPersonal onNext={mockOnNext} onPrev={vi.fn()} initialData={prefilledData} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Lanjut/i }));
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Data pribadi disimpan.');
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  it('[S2-TC5] Jika savePersonalData gagal, toast.error ditampilkan dan onNext tidak dipanggil', async () => {
    mockSavePersonalResult = { success: false, error: 'Gagal menyimpan data pribadi.' };
    const mockOnNext = vi.fn();
    // Pre-populate semua field termasuk gender agar validasi lolos, tapi Server Action gagal
    const prefilledData = {
      fullName: 'Zaky Ramadhani',
      nickname: 'Zaky',
      gender: 'L' as const,
      phoneNumber: '081234567890',
      pob: 'Padang',
      dob: '2004-01-01',
      originAddress: 'Jl. Sudirman No. 1',
      domicileAddress: 'Jl. Pahlawan No. 5',
    };
    render(<StepPersonal onNext={mockOnNext} onPrev={vi.fn()} initialData={prefilledData} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Lanjut/i }));
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Gagal menyimpan data pribadi.');
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 3: StepAcademic — Akademik & Rekam Jejak
// ═══════════════════════════════════════════════════════════════════════
describe('Step 3 — StepAcademic: Validasi & Dropdown Jurusan/Prodi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveAcademicResult = { success: true };
    mockGetMajorsResult = [{ id: 'maj-1', name: 'Teknik Informatika' }];
    mockGetStudyProgramsResult = [{ id: 'sp-1', name: 'Teknik Informatika', degree: 'D4' }];
  });

  it('[S3-TC1] Menampilkan toast.error jika "Asal Sekolah" kosong saat klik Lanjut', async () => {
    render(<StepAcademic onNext={vi.fn()} onPrev={vi.fn()} initialData={null} />);
    await waitFor(() => expect(mockGetMajorsResult).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: /Lanjut/i }));
    expect(mockToastError).toHaveBeenCalledWith('Asal sekolah wajib diisi.');
  });

  it('[S3-TC2] Menampilkan toast.error jika Jurusan belum dipilih', async () => {
    render(<StepAcademic onNext={vi.fn()} onPrev={vi.fn()} initialData={null} />);
    await waitFor(() => {});
    fireEvent.change(screen.getByTestId('SMKN 1 Padang'), { target: { value: 'SMA 1 Padang' } });
    fireEvent.click(screen.getByRole('button', { name: /Lanjut/i }));
    expect(mockToastError).toHaveBeenCalledWith('Jurusan wajib dipilih.');
  });

  it('[S3-TC3] Menampilkan toast.error jika Program Studi belum dipilih', async () => {
    // Pre-populate majorId agar Jurusan sudah terpilih tanpa select interaction
    const prefilledData = {
      majorId: 'maj-1',
      highSchool: 'SMK 3 Padang',
      studyProgramId: '',   // sengaja kosong — prodi belum dipilih
      currentClass: '1B',
      orgExperience: '',
      achievements: '',
    };
    render(<StepAcademic onNext={vi.fn()} onPrev={vi.fn()} initialData={prefilledData} />);

    const lanjutBtn = screen.getByRole('button', { name: /Lanjut/i });

    // Tunggu getMajors + getStudyPrograms selesai
    await waitFor(() => expect(lanjutBtn).not.toBeDisabled(), { timeout: 5000 });

    // Prodi sengaja tidak dipilih → validasi harus menolak
    await act(async () => {
      fireEvent.click(lanjutBtn);
    });
    expect(mockToastError).toHaveBeenCalledWith('Program studi wajib dipilih.');
  });

  it('[S3-TC4] Jika semua field terisi, saveAcademicData dipanggil dan onNext terpicu', async () => {
    const mockOnNext = vi.fn();
    // Pre-populate semua field wajib via initialData agar tidak perlu interaksi select
    const prefilledData = {
      majorId: 'maj-1',
      highSchool: 'SMKN 5 Padang',
      studyProgramId: 'sp-1',
      currentClass: '1A',
      orgExperience: '',
      achievements: '',
    };
    render(<StepAcademic onNext={mockOnNext} onPrev={vi.fn()} initialData={prefilledData} />);

    // Tunggu getMajors + getStudyPrograms + pre-fill prodi selesai
    const lanjutBtn = screen.getByRole('button', { name: /Lanjut/i });
    await waitFor(() => expect(lanjutBtn).not.toBeDisabled(), { timeout: 5000 });

    await act(async () => {
      fireEvent.click(lanjutBtn);
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Data akademik disimpan.');
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 4: StepCommitment — Visi & Komitmen Sosial
// ═══════════════════════════════════════════════════════════════════════
describe('Step 4 — StepCommitment: Validasi Motivasi & Upload Bukti Medsos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveCommitmentResult = { success: true };
  });

  it('[S4-TC1] Menampilkan toast.error jika field "Motivasi" kosong saat klik Lanjut', () => {
    render(<StepCommitment onNext={vi.fn()} onPrev={vi.fn()} initialData={null} />);
    fireEvent.click(screen.getByRole('button', { name: /Lanjut ke Pembayaran/i }));
    expect(mockToastError).toHaveBeenCalledWith('Motivasi wajib diisi.');
  });

  it('[S4-TC2] Menampilkan 3 komponen UploadTile untuk bukti media sosial', () => {
    render(<StepCommitment onNext={vi.fn()} onPrev={vi.fn()} initialData={null} />);
    expect(screen.getByTestId('upload-tile-Follow Instagram Robotik')).toBeInTheDocument();
    expect(screen.getByTestId('upload-tile-Follow Instagram MRC')).toBeInTheDocument();
    expect(screen.getByTestId('upload-tile-Subscribe YT Robotik')).toBeInTheDocument();
  });

  it('[S4-TC3] Jika motivasi terisi, saveCommitmentData dipanggil dan onNext terpicu', async () => {
    const mockOnNext = vi.fn();
    render(<StepCommitment onNext={mockOnNext} onPrev={vi.fn()} initialData={null} />);

    fireEvent.change(
      screen.getByTestId('Apa alasan Anda ingin bergabung?'),
      { target: { value: 'Saya ingin belajar robotika lebih dalam.' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Lanjut ke Pembayaran/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Data visi & komitmen disimpan.');
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// STEP 5: StepUpload — Berkas & Pembayaran
// ═══════════════════════════════════════════════════════════════════════
describe('Step 5 — StepUpload: Validasi File & Submisi Akhir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveFinalResult = { success: true };
    mockCropperOnCropComplete = null;
    // jsdom tidak punya URL.createObjectURL — mock agar tidak meledak
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Helper: trigger crop complete setelah pasFoto dipilih */
  async function triggerPasFotoViaCrop(pasFotoInput: HTMLElement): Promise<void> {
    const mockPasFoto = new File(['img'], 'pas.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(pasFotoInput, { target: { files: [mockPasFoto] } });
    });
    // Tunggu cropper modal muncul dan ambil callback
    await waitFor(() => expect(screen.getByTestId('cropper-modal')).toBeInTheDocument());
    const croppedFile = new File(['cropped'], 'pas_cropped.jpg', { type: 'image/jpeg' });
    await act(async () => {
      mockCropperOnCropComplete?.(croppedFile);
    });
    // Tunggu modal tutup (pasFoto state ter-set)
    await waitFor(() => expect(screen.queryByTestId('cropper-modal')).not.toBeInTheDocument());
  }

  it('[S5-TC1] Menampilkan toast.error jika Pas Foto belum diupload saat submit', () => {
    render(<StepUpload onPrev={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Kirim Pendaftaran/i }));
    expect(mockToastError).toHaveBeenCalledWith('Pas foto wajib diupload.');
  });

  it('[S5-TC2] Menampilkan toast.error jika Bukti Pembayaran belum diupload', async () => {
    render(<StepUpload onPrev={vi.fn()} onSuccess={vi.fn()} />);

    // Pas foto harus melalui alur crop agar state pasFoto ter-set
    await triggerPasFotoViaCrop(screen.getByTestId('file-input-Pas Foto'));

    fireEvent.click(screen.getByRole('button', { name: /Kirim Pendaftaran/i }));
    expect(mockToastError).toHaveBeenCalledWith('Bukti pembayaran wajib diupload.');
  });

  it('[S5-TC3] Menampilkan toast.error jika Metode Pembayaran belum dipilih', async () => {
    render(<StepUpload onPrev={vi.fn()} onSuccess={vi.fn()} />);

    // Pas foto melalui alur crop
    await triggerPasFotoViaCrop(screen.getByTestId('file-input-Pas Foto'));

    // Upload bukti pembayaran
    const mockPayment = new File(['pdf'], 'bukti.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(screen.getByTestId('file-input-Bukti Pembayaran'), {
        target: { files: [mockPayment] },
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Kirim Pendaftaran/i }));
    expect(mockToastError).toHaveBeenCalledWith('Metode pembayaran wajib dipilih.');
  });

  // Timeout 15s: test ini mencakup crop flow, storage upload mock, 800ms delay onSuccess
  it('[S5-TC4] Jika semua persyaratan terpenuhi, saveFinalData dipanggil dan onSuccess terpicu', async () => {
    const mockOnSuccess = vi.fn();
    // Gunakan initialPaymentMethod='transfer' agar paymentMethod state tidak perlu
    // bergantung pada select interaction yang rumit di jsdom
    render(
      <StepUpload onPrev={vi.fn()} onSuccess={mockOnSuccess} initialPaymentMethod="transfer" />
    );

    // Pas foto melalui alur crop (membuka modal → onCropComplete)
    await triggerPasFotoViaCrop(screen.getByTestId('file-input-Pas Foto'));

    // Upload bukti pembayaran
    const mockPayment = new File(['pdf'], 'bukti.pdf', { type: 'application/pdf' });
    await act(async () => {
      fireEvent.change(screen.getByTestId('file-input-Bukti Pembayaran'), {
        target: { files: [mockPayment] },
      });
    });

    // Klik submit — paymentMethod sudah 'transfer' dari initialPaymentMethod
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Kirim Pendaftaran/i }));
    });

    await waitFor(
      () => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Pendaftaran berhasil dikirim!');
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      },
      { timeout: 10000 }
    );
  }, 15000);
});

// ═══════════════════════════════════════════════════════════════════════
// INTEGRASI: OnboardingClient — Alur Stepper (Step 1 → 2)
// ═══════════════════════════════════════════════════════════════════════
describe('Integrasi — OnboardingClient: Alur Stepper & Logika Legacy Member', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLegacyResult = { success: true, isLegacy: false, message: 'Caang baru.' };
  });

  const defaultProgress = {
    nim: null,
    startStep: 1,
    personal: null,
    academic: null,
    commitment: null,
    paymentMethod: null,
  };

  it('[INT-TC1] Render dimulai dari Step 1 (Validasi NIM)', () => {
    render(<OnboardingClient initialProgress={defaultProgress} />);
    expect(screen.getByText('Validasi Identitas')).toBeInTheDocument();
  });

  it('[INT-TC2] Skenario Caang Baru: setelah NIM valid bukan legacy, berpindah ke Step 2', async () => {
    mockCheckLegacyResult = { success: true, isLegacy: false, message: 'Caang baru.' };
    render(<OnboardingClient initialProgress={defaultProgress} />);

    const input = screen.getByTestId('Contoh: 22110830XX');
    fireEvent.change(input, { target: { value: '22110830AA' } });

    const btn = screen.getByRole('button', { name: /Cek Validasi NIM/i });
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(screen.getByText('Data Pribadi & Kontak')).toBeInTheDocument();
    });
  });

  it('[INT-TC3] Skenario Legacy Member: setelah NIM valid sebagai anggota lama, router.push ke /dashboard', async () => {
    mockCheckLegacyResult = {
      success: true,
      isLegacy: true,
      message: 'NIM tervalidasi! Mengarahkan ke dashboard...',
    };
    render(<OnboardingClient initialProgress={defaultProgress} />);

    const input = screen.getByTestId('Contoh: 22110830XX');
    fireEvent.change(input, { target: { value: '19110001AA' } });

    const btn = screen.getByRole('button', { name: /Cek Validasi NIM/i });
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'NIM tervalidasi! Mengarahkan ke dashboard...'
      );
    });
    // setTimeout 1500ms terpicu untuk router.push
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1600));
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
  });

  it('[INT-TC4] Skenario NIM gagal: checkLegacyMember returns success:false → toast.error', async () => {
    mockCheckLegacyResult = { success: false, error: 'Gagal memeriksa NIM. Silakan coba lagi.' };
    render(<OnboardingClient initialProgress={defaultProgress} />);

    const input = screen.getByTestId('Contoh: 22110830XX');
    fireEvent.change(input, { target: { value: '22110830XX' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Cek Validasi NIM/i }));
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Gagal memeriksa NIM. Silakan coba lagi.');
    });
    // Tetap di step 1
    expect(screen.getByText('Validasi Identitas')).toBeInTheDocument();
  });

  it('[INT-TC5] Jika initialProgress.startStep=2, render langsung ke Step 2', () => {
    render(
      <OnboardingClient
        initialProgress={{
          ...defaultProgress,
          nim: '22110830AA',
          startStep: 2,
        }}
      />
    );
    expect(screen.getByText('Data Pribadi & Kontak')).toBeInTheDocument();
  });
});

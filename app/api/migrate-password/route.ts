import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { FirebaseScrypt } from "firebase-scrypt";

// Gunakan Service Role Key untuk akses Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. Cari user di Supabase berdasarkan email
    const {
      data: { users },
      error: userError,
    } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) throw userError;

    const user = users.find((u) => u.email === email);
    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // 2. Ambil metadata dan targetkan objek fbuser
    const metaData = user.user_metadata?.fbuser;

    if (!metaData || !metaData.passwordHash) {
      return NextResponse.json(
        { error: "Data migrasi tidak lengkap atau akun ini bukan akun lama" },
        { status: 400 },
      );
    }

    // FIX: 3. Inisialisasi Class FirebaseScrypt sesuai dokumentasi resminya
    const scrypt = new FirebaseScrypt({
      signerKey: process.env.FIREBASE_SIGNER_KEY!,
      saltSeparator: process.env.FIREBASE_SALT_SEPARATOR!,
      rounds: 8,
      memCost: 14,
    });

    // FIX: 4. Jalankan metode verify (urutan parameter: password, salt, hash)
    const isValid = await scrypt.verify(
      password,
      metaData.passwordSalt,
      metaData.passwordHash,
    );

    if (!isValid) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    // 5. JIKA VALID: Update password di Supabase agar menggunakan Bcrypt bawaan
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: password,
        user_metadata: {
          ...user.user_metadata,
          fbuser: {
            ...metaData,
            passwordHash: null, // Bersihkan jejak hash lama untuk keamanan
            passwordSalt: null,
          },
        },
      });

    if (updateError) throw updateError;

    return NextResponse.json(
      { message: "Password berhasil dimigrasi" },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan server internal";
    // Mencetak error asli ke terminal VS Code Anda agar mudah di-debug jika terjadi masalah lain
    console.error("API Error / migrate-password:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

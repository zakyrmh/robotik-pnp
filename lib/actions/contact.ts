"use server";

import { z } from "zod";

const contactSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap harus diisi"),
  organization: z.string().optional(),
  email: z.string().email("Format email tidak valid"),
  category: z.string().min(1, "Kategori harus dipilih"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export async function submitContactMessage(data: ContactFormData) {
  try {
    const validated = contactSchema.parse(data);

    // Mocking the database insertion
    console.log("Mock: Contact message submitted successfully", validated);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return { success: true, message: "Pesan Anda telah berhasil dikirim!" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

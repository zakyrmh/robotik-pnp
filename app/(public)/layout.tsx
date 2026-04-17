import Footer from "@/components/layouts/Footer";
import Navbar from "@/components/layouts/Navbar";
import { ThemeProvider } from "@/components/layouts/ThemeProvider";
import ThemeToggle from "@/components/layouts/ThemeToggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="pt-16">
      <Navbar />
      <ThemeProvider
        attribute="class"
        defaultTheme="light" // Sesuai permintaan Anda: default light mode
        enableSystem={false}
      >
        {children}
        <ThemeToggle />
      </ThemeProvider>
      <Footer />
    </main>
  );
}

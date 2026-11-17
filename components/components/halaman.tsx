import Link from "next/link";
import { alamatHalaman, type Saringan } from "@/data/data/saring";

type Props = {
  s: Saringan;
  hal: number;
  jumlah: number;
};

export default function Halaman({ s, hal, jumlah }: Props) {
  // Hanya ada satu halaman: tidak menampilkan apa pun
  if (jumlah <= 1) return null;

  const nomor = Array.from({ length: jumlah }, (_, i) => i + 1);

  return (
    <nav className="mt-6 flex flex-wrap items-center gap-3">
      {/* Tidak tampil di halaman 1 */}
      {hal > 1 && (
        <Link href={alamatHalaman(s, hal - 1)}>« Sebelumnya</Link>
      )}

      {/* Nomor yang sedang dibuka: biru dan tebal */}
      {nomor.map((n) => (
        <Link
          key={n}
          href={alamatHalaman(s, n)}
          className={n === hal ? "font-bold text-blue-600" : "text-gray-600"}
        >
          {n}
        </Link>
      ))}

      {/* Tidak tampil di halaman terakhir */}
      {hal < jumlah && (
        <Link href={alamatHalaman(s, hal + 1)}>Berikutnya »</Link>
      )}
    </nav>
  );
}
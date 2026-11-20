
export type Event = {
  id: number;
  judul: string;
  kategori: string;
  tanggal: string;
  lokasi: string;
  harga: number;
  kuota: number;
  terisi: number;
  gambar?: string | null;
};

export function srcGambarEvent(src?: string | null) {
  if (!src) {
    return "/image/default.png";
  }

  return src.startsWith("/img/")
    ? `/image/${src.slice("/img/".length)}`
    : src;
}

export const events: Event[] = [
  {
    id: 1,
    judul: "Workshop React untuk Pemula",
    kategori: "Workshop",
    tanggal: "2026-11-14",
    lokasi: "Lab RPL",
    harga: 50000,
    kuota: 30,
    terisi: 12,
    gambar: "/image/event-1.png",
  },
  {
    id: 2,
    judul: "Turnamen Futsal Antar Kelas",
    kategori: "Olahraga",
    tanggal: "2026-11-20",
    lokasi: "Lapangan Sekolah",
    harga: 0,
    kuota: 20,
    terisi: 20,
    gambar: "/image/event-2.png",
  },
  {
    id: 3,
    judul: "Konser Musik Akustik",
    kategori: "Musik",
    tanggal: "2026-11-27",
    lokasi: "Aula",
    harga: 25000,
    kuota: 150,
    terisi: 96,
    gambar: "/image/event-3.png",
  },
];

export function rupiah(n: number) {
  return n === 0
    ? "Gratis"
    : "Rp " + n.toLocaleString("id-ID");
}

import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { events } from "@/data/data/events";
import KartuEvent from "@/components/components/kartuEvent";

type Pesanan = {
  id: string;
  eventId: number;
  nama: string;
  email: string;
  jumlah: number;
  total: number;
  tanggal: string;
};

async function ambilPesanan(): Promise<Pesanan[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "pesanan.json");
    const isi = await readFile(filePath, "utf-8");
    return JSON.parse(isi);
  } catch {
    return [];
  }
}

export default async function Beranda() {
  const pesanan = await ambilPesanan();

  const terdekat = events.slice(0, 3).map((event) => {
    const sudahDipesan = pesanan
      .filter((p) => p.eventId === event.id)
      .reduce((total, p) => total + p.jumlah, 0);

    return {
      ...event,
      terisi: event.terisi + sudahDipesan,
    };
  });

  return (
    <div>
      <section className="py-12 text-center">
        <h1 className="text-4xl font-bold">
          Temukan event seru di sekolahmu
        </h1>
        <p className="mt-3 text-slate-600">
          Workshop, lomba, musik, dan bazar. Pesan tiketnya di sini.
        </p>
        <Link
          href="/event"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          Lihat semua event
        </Link>
      </section>

      <h2 className="mb-3 text-xl font-semibold">Event terdekat</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {terdekat.map((e) => (
          <KartuEvent key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}
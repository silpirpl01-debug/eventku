
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { events, rupiah } from "@/data/data/events";
import { batalkanPesanan } from "@/app/actions/actions";

type Pesanan = {
  id: string;
  eventId: number;
  nama: string;
  email: string;
  jumlah: number;
  total: number;
  tanggal: string;
};

const filePath = path.join(process.cwd(), "data", "pesanan.json");

async function ambilPesanan(): Promise<Pesanan[]> {
  try {
    const isi = await readFile(filePath, "utf8");
    return JSON.parse(isi);
  } catch {
    return [];
  }
}

export default async function HalamanPesanan() {
  const namaCookie = (await cookies()).get("nama")?.value ?? "";

  const pesanan = await ambilPesanan();

  const totalTiket = pesanan.reduce((t, p) => t + p.jumlah, 0);
  const pendapatan = pesanan.reduce((t, p) => t + p.total, 0);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">
        Daftar Pesanan
      </h1>

      {namaCookie && (
        <p className="mb-3 text-slate-600">
          Halo, <b>{namaCookie}</b>!
        </p>
      )}

      {pesanan.length === 0 ? (
        <p className="text-slate-500">
          Belum ada pesanan.{" "}
          <Link
            href="/event"
            className="text-blue-600 underline"
          >
            Pilih event
          </Link>
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {pesanan.length} pesanan · {totalTiket} tiket · Pendapatan{" "}
            {rupiah(pendapatan)}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full rounded-xl border bg-white text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Event</th>
                  <th className="p-2">Pemesan</th>
                  <th className="p-2">Tiket</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {pesanan.map((p, index) => {
                  const milikKamu =
                    namaCookie !== "" && p.nama === namaCookie;

                  const event = events.find(
                    (e) => e.id === p.eventId
                  );

                  return (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{index + 1}</td>

                      <td className="p-2">
                        {event?.judul ?? "Event tidak ditemukan"}
                      </td>

                      <td className="p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {p.nama}

                          {milikKamu && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                              Kamu
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-2">{p.jumlah}</td>

                      <td className="p-2">
                        {rupiah(p.total)}
                      </td>

                      <td className="p-2">
                        {milikKamu && (
                          <form action={batalkanPesanan}>
                            <input
                              type="hidden"
                              name="id"
                              value={p.id}
                            />

                            <button
                              type="submit"
                              className="font-medium text-red-600 underline hover:text-red-800"
                            >
                              Batalkan
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

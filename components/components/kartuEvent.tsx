
import Link from "next/link";
import Image from "next/image";
import {
  rupiah,
  srcGambarEvent,
  type Event,
} from "@/data/data/events";

export default function KartuEvent({ event }: { event: Event }) {
  const sisa = event.kuota - event.terisi;

  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <Image
        src={srcGambarEvent(event.gambar)}
        alt={event.judul}
        width={400}
        height={210}
        className="mb-3 h-40 w-full rounded-lg object-cover"
      />

      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
        {event.kategori}
      </span>

      <h2 className="mt-3 text-lg font-bold">
        {event.judul}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {event.tanggal} · {event.lokasi}
      </p>

      <p className="mt-3 font-semibold">
        {rupiah(event.harga)}
      </p>

      {sisa <= 0 ? (
        <p className="mt-2 text-sm font-medium text-red-600">
          Tiket habis
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          Sisa {sisa} tiket
        </p>
      )}

      <Link
        href={`/event/${event.id}`}
        className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        Lihat Detail
      </Link>
    </article>
  );
}


"use client";

import { useActionState, useState } from "react";
import { pesanEvent, type FormState } from "@/app/actions/actions";
import { rupiah, type Event } from "@/data/data/events";

export default function FormPesan({
  event,
  namaAwal,
}: {
  event: Event;
  namaAwal: string;
}) {
  const awal: FormState = {};

  const [hasil, kirim, sedangKirim] = useActionState(
    pesanEvent,
    awal
  );

  const [nama, setNama] = useState(namaAwal);
  const [email, setEmail] = useState("");
  const [jumlah, setJumlah] = useState(1);

  const sisa = event.kuota - event.terisi;

  if (sisa <= 0) {
    return (
      <p className="mt-6 font-medium text-red-600">
        Tiket sudah habis.
      </p>
    );
  }

  return (
    <form action={kirim} className="mt-6 space-y-3 border-t pt-4">
      <h2 className="text-lg font-semibold">Pesan tiket</h2>

      <input type="hidden" name="eventId" value={event.id} />

      <div>
        <input
          name="nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama pemesan"
          className="block w-full rounded border px-3 py-2"
        />

        {hasil.errors?.nama && (
          <p className="text-sm text-red-600">
            {hasil.errors.nama}
          </p>
        )}
      </div>

      <div>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email pemesan"
          className="block w-full rounded border px-3 py-2"
        />

        {hasil.errors?.email && (
          <p className="text-sm text-red-600">
            {hasil.errors.email}
          </p>
        )}
      </div>

      <div>
        <input
          name="jumlah"
          type="number"
          min="1"
          value={jumlah}
          onChange={(e) => setJumlah(Number(e.target.value))}
          className="block w-32 rounded border px-3 py-2"
        />

        {hasil.errors?.jumlah && (
          <p className="text-sm text-red-600">
            {hasil.errors.jumlah}
          </p>
        )}
      </div>

      <p>
        Total: <b>{rupiah(event.harga * jumlah)}</b>
      </p>

      {hasil.message && (
        <p className={hasil.success ? "text-green-700" : "text-red-600"}>
          {hasil.message}
        </p>
      )}

      <button
        type="submit"
        disabled={sedangKirim}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sedangKirim ? "Memproses ..." : "Pesan"}
      </button>
    </form>
  );
}

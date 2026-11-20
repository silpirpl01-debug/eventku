"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { pastikanAdmin } from "@/lib/sesi";

export type HasilEvent = {
  pesan: string;
  galat: Partial<
    Record<
      "judul" | "kategori" | "tanggal" | "Lokasi" | "harga" | "kuota",
      string
    >
  >;
  isian: Record<string, string>;
};

// Memperbarui halaman setelah data event berubah.
function segarkan(id?: number) {
  revalidatePath("/");
  revalidatePath("/event");
  revalidatePath("/admin");

  if (id) {
    revalidatePath(`/event/${id}`);
  }
}

// Menyimpan event baru atau memperbarui event.
export async function simpanEvent(
  _sebelum: HasilEvent,
  formData: FormData
): Promise<HasilEvent> {
  await pastikanAdmin();

  const idTeks = String(formData.get("id") ?? "");
  const id = idTeks ? Number(idTeks) : null;

  const isian = {
    id: idTeks,
    judul: String(formData.get("judul") ?? "").trim(),
    kategori: String(formData.get("kategori") ?? "").trim(),
    tanggal: String(formData.get("tanggal") ?? "").trim(),
    Lokasi: String(formData.get("Lokasi") ?? "").trim(),
    harga: String(formData.get("harga") ?? "").trim(),
    kuota: String(formData.get("kuota") ?? "").trim(),
    gambar: String(formData.get("gambar") ?? "").trim(),
  };

  const harga = Number(isian.harga);
  const kuota = Number(isian.kuota);

  const galat: HasilEvent["galat"] = {};

  // Validasi ID.
  if (id !== null && (!Number.isInteger(id) || id < 1)) {
    return {
      pesan: "ID event tidak valid.",
      galat: {},
      isian,
    };
  }

  // Validasi judul.
  if (isian.judul.length < 3 || isian.judul.length > 80) {
    galat.judul = "Judul 3 sampai 80 huruf.";
  }

  // Validasi kategori.
  if (isian.kategori.length < 3 || isian.kategori.length > 20) {
    galat.kategori = "Kategori 3 sampai 20 huruf.";
  }

  // Validasi tanggal.
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(isian.tanggal) ||
    Number.isNaN(Date.parse(isian.tanggal))
  ) {
    galat.tanggal = "Tanggal tidak valid.";
  }

  // Validasi lokasi.
  if (isian.Lokasi.length < 2) {
    galat.Lokasi = "Lokasi minimal 2 huruf.";
  }

  // Validasi harga.
  if (
    isian.harga === "" ||
    !Number.isInteger(harga) ||
    harga < 0 ||
    harga > 1_000_000
  ) {
    galat.harga = "Harga 0 sampai 1.000.000 (bilangan bulat).";
  }

  // Validasi kuota.
  if (
    !Number.isInteger(kuota) ||
    kuota < 1 ||
    kuota > 1000
  ) {
    galat.kuota = "Kuota 1 sampai 1000 (bilangan bulat).";
  }

  // Kuota tidak boleh lebih kecil dari tiket yang sudah terisi.
  if (id !== null && !galat.kuota) {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("terisi")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return {
        pesan: "Gagal memeriksa kuota: " + error.message,
        galat: {},
        isian,
      };
    }

    if (!data) {
      return {
        pesan: "Event tidak ditemukan.",
        galat: {},
        isian,
      };
    }

    if (kuota < data.terisi) {
      galat.kuota = `Kuota tidak boleh di bawah tiket terisi (${data.terisi}).`;
    }
  }

  // Jika ada kesalahan validasi, kembalikan pesan.
  if (Object.keys(galat).length > 0) {
    return {
      pesan: "Periksa lagi isian yang merah.",
      galat,
      isian,
    };
  }

  // Data yang akan disimpan ke Supabase.
  const baris = {
    judul: isian.judul,
    kategori: isian.kategori,
    tanggal: isian.tanggal,
    Lokasi: isian.Lokasi,
    harga,
    kuota,
    gambar: isian.gambar || null,
  };

  // Tambah event baru atau perbarui event lama.
  const { error } =
    id === null
      ? await supabaseAdmin.from("events").insert(baris)
      : await supabaseAdmin.from("events").update(baris).eq("id", id);

  if (error) {
    return {
      pesan: "Gagal menyimpan: " + error.message,
      galat: {},
      isian,
    };
  }

  segarkan(id ?? undefined);

  redirect(
    "/admin?info=" +
      encodeURIComponent(
        id === null ? "Event ditambahkan." : "Perubahan disimpan."
      )
  );
}

// Menghapus event.
export async function hapusEvent(formData: FormData) {
  await pastikanAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id < 1) {
    redirect("/admin");
  }

  const { error } = await supabaseAdmin
    .from("events")
    .delete()
    .eq("id", id);

  if (error) {
    // 23503 = event masih digunakan oleh tabel lain.
    const pesan =
      error.code === "23503"
        ? "Event ini sudah punya pesanan, jadi tidak bisa dihapus."
        : "Gagal menghapus: " + error.message;

    redirect("/admin?galat=" + encodeURIComponent(pesan));
  }

  segarkan(id);

  redirect(
    "/admin?info=" + encodeURIComponent("Event dihapus.")
  );
}
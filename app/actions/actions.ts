
"use server";

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { events } from "@/data/data/events";

export type FormState = {
  errors?: {
    nama?: string;
    email?: string;
    jumlah?: string;
  };
  message?: string;
  success?: boolean;
};

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

// ACTION 1: Memesan tiket
export async function pesanEvent(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const eventId = Number(formData.get("eventId"));
  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const jumlahText = String(formData.get("jumlah") ?? "");
  const jumlah = Number(jumlahText);

  const event = events.find((item) => item.id === eventId);

  if (!event) {
    return { message: "Event tidak ditemukan." };
  }

  const errors: NonNullable<FormState["errors"]> = {};

  if (nama.length < 3) {
    errors.nama = "Nama minimal 3 huruf.";
  } else if (nama.length > 40) {
    errors.nama = "Nama maksimal 40 huruf.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Email tidak valid.";
  }

  if (!jumlahText || !Number.isInteger(jumlah) || jumlah < 1) {
    errors.jumlah = "Jumlah tiket minimal 1.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await mkdir(path.dirname(filePath), { recursive: true });

    let pesananLama: Pesanan[] = [];

    try {
      const isi = await readFile(filePath, "utf8");
      pesananLama = JSON.parse(isi);
    } catch {
      pesananLama = [];
    }

    const sudahDipesan = pesananLama
      .filter((item) => item.eventId === event.id)
      .reduce((total, item) => total + item.jumlah, 0);

    const sisa = event.kuota - event.terisi - sudahDipesan;

    if (jumlah > sisa || sisa <= 0) {
      return {
        errors: {
          jumlah: `Sisa tiket hanya ${Math.max(0, sisa)}.`,
        },
      };
    }

    const pesananBaru: Pesanan = {
      id: Date.now().toString(),
      eventId,
      nama,
      email,
      jumlah,
      total: event.harga * jumlah,
      tanggal: new Date().toISOString(),
    };

    await writeFile(
      filePath,
      JSON.stringify([...pesananLama, pesananBaru], null, 2),
      "utf8"
    );

    // Simpan nama ke cookie selama 30 hari
    const toples = await cookies();

    toples.set("nama", nama, {
      maxAge: 60 * 60 * 24 * 30,
    });

    revalidatePath("/event");
    revalidatePath(`/event/${eventId}`);
    revalidatePath("/pesanan");

    return {
      success: true,
      message: `Terima kasih ${nama}! ${jumlah} tiket berhasil dipesan.`,
    };
  } catch {
    return {
      message: "Pesanan gagal disimpan.",
    };
  }
}

// ACTION 2: Membatalkan pesanan
export async function batalkanPesanan(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const namaSaya = (await cookies()).get("nama")?.value;

  if (!id || !namaSaya) return;

  try {
    const isi = await readFile(filePath, "utf8");
    const daftarPesanan: Pesanan[] = JSON.parse(isi);

    // Memeriksa apakah pesanan benar-benar milik pengguna
    const index = daftarPesanan.findIndex(
      (p) => p.id === id && p.nama === namaSaya
    );

    if (index === -1) return;

    // Menghapus pesanan
    const [batal] = daftarPesanan.splice(index, 1);

    await writeFile(
      filePath,
      JSON.stringify(daftarPesanan, null, 2),
      "utf8"
    );

    revalidatePath("/event");
    revalidatePath(`/event/${batal.eventId}`);
    revalidatePath("/pesanan");
  } catch {
    return;
  }
}

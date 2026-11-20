"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";

import { ambilEvent, hitungPesanan } from "@/data/data/ambil";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  NAMA_COOKIE,
  UMUR_SESI,
  buatToken,
} from "@/lib/sesi";

export type HasilMasuk = {
  pesan: string;
};

export type HasilPesan = {
  berhasil: boolean;
  pesan: string;
  galat: {
    nama?: string;
    email?: string;
    jumlah?: string;
  };
  isian: {
    nama: string;
    email: string;
  };
};

const NAMA_COOKIE_GAGAL = "login_gagal";
const BATAS_PERCOBAAN = 5;
const DURASI_KUNCI = 60;

export async function pesanTiket(
  _sebelum: HasilPesan,
  formData: FormData
): Promise<HasilPesan> {
  const isian = {
    nama: String(formData.get("nama") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };
  const eventId = Number(formData.get("eventId"));
  const jumlahText = String(formData.get("jumlah") ?? "");
  const jumlah = Number(jumlahText);
  const galat: HasilPesan["galat"] = {};

  if (isian.nama.length < 3) {
    galat.nama = "Nama minimal 3 huruf.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(isian.email)) {
    galat.email = "Email tidak valid.";
  }

  if (
    !jumlahText ||
    !Number.isSafeInteger(jumlah) ||
    jumlah < 1 ||
    jumlah > 5
  ) {
    galat.jumlah = "Jumlah tiket harus antara 1 dan 5.";
  }

  if (Object.keys(galat).length > 0) {
    return { berhasil: false, pesan: "", galat, isian };
  }

  if (!Number.isSafeInteger(eventId) || eventId < 1) {
    return {
      berhasil: false,
      pesan: "Event tidak ditemukan.",
      galat: {},
      isian,
    };
  }

  const event = await ambilEvent(eventId);

  if (!event) {
    return {
      berhasil: false,
      pesan: "Event tidak ditemukan.",
      galat: {},
      isian,
    };
  }

  const { totalTiket } = await hitungPesanan(eventId);
  const sisa = event.kuota - event.terisi - totalTiket;

  if (jumlah > sisa || sisa <= 0) {
    return {
      berhasil: false,
      pesan: "",
      galat: {
        jumlah: `Sisa tiket hanya ${Math.max(0, sisa)}.`,
      },
      isian,
    };
  }

  const { error } = await supabaseAdmin.from("pesanan").insert({
    event_id: event.id,
    nama: isian.nama,
    email: isian.email,
    jumlah,
    total: event.harga * jumlah,
  });

  if (error) {
    return {
      berhasil: false,
      pesan: "Pesanan gagal disimpan: " + error.message,
      galat: {},
      isian,
    };
  }

  (await cookies()).set("nama", isian.nama, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath(`/event/${event.id}`);
  revalidatePath("/event");
  revalidatePath("/pesanan");

  return {
    berhasil: true,
    pesan: `Terima kasih ${isian.nama}! ${jumlah} tiket berhasil dipesan.`,
    galat: {},
    isian,
  };
}

function bandingkanSandi(input: string, sandiBenar: string) {
  const inputBuffer = Buffer.from(input, "utf8");
  const sandiBuffer = Buffer.from(sandiBenar, "utf8");

  if (inputBuffer.length !== sandiBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, sandiBuffer);
}

export async function masuk(
  _sebelum: HasilMasuk,
  formData: FormData
): Promise<HasilMasuk> {
  const sandi = String(formData.get("sandi") ?? "");
  const dari = String(formData.get("dari") ?? "");

  const penyimpananCookie = await cookies();

  // Membaca jumlah percobaan login yang gagal.
  const dataGagal = penyimpananCookie.get(NAMA_COOKIE_GAGAL)?.value;

  const [jumlahText, waktuKunciText] = (dataGagal ?? "0.0").split(".");

  let jumlahGagal = Number(jumlahText);
  const waktuKunci = Number(waktuKunciText);

  if (!Number.isSafeInteger(jumlahGagal) || jumlahGagal < 0) {
    jumlahGagal = 0;
  }

  // Memeriksa apakah waktu penguncian masih berlaku.
  if (Number.isFinite(waktuKunci) && waktuKunci > Date.now()) {
    const sisaWaktu = Math.ceil(
      (waktuKunci - Date.now()) / 1000
    );

    return {
      pesan: `Terlalu banyak percobaan. Coba lagi dalam ${sisaWaktu} detik.`,
    };
  }

  // Jika waktu penguncian sudah selesai, hitungan direset.
  if (Number.isFinite(waktuKunci) && waktuKunci > 0) {
    jumlahGagal = 0;
  }

  const sandiBenar = process.env.ADMIN_PASSWORD;

  if (!sandiBenar || !bandingkanSandi(sandi, sandiBenar)) {
    jumlahGagal++;

    // Mengunci login setelah 5 kali percobaan salah.
    if (jumlahGagal >= BATAS_PERCOBAAN) {
      const waktuBaru = Date.now() + DURASI_KUNCI * 1000;

      penyimpananCookie.set(
        NAMA_COOKIE_GAGAL,
        `${jumlahGagal}.${waktuBaru}`,
        {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: DURASI_KUNCI,
        }
      );

      return {
        pesan: "Terlalu banyak percobaan. Login dikunci selama 1 menit.",
      };
    }

    // Menyimpan jumlah percobaan yang gagal.
    penyimpananCookie.set(
      NAMA_COOKIE_GAGAL,
      `${jumlahGagal}.0`,
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 300,
      }
    );

    return {
      pesan: `Kata sandi salah. Percobaan ${jumlahGagal} dari ${BATAS_PERCOBAAN}.`,
    };
  }

  // Login berhasil: hapus hitungan percobaan gagal.
  penyimpananCookie.delete(NAMA_COOKIE_GAGAL);

  // Membuat sesi admin.
  penyimpananCookie.set(NAMA_COOKIE, await buatToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_SESI,
  });

  redirect(dari.startsWith("/admin") ? dari : "/admin");
}

export async function keluar() {
  const penyimpananCookie = await cookies();

  penyimpananCookie.delete(NAMA_COOKIE);
  penyimpananCookie.delete(NAMA_COOKIE_GAGAL);

  redirect("/login");
}

export async function batalkanPesanan(formData: FormData) {
  const nomor = Number(formData.get("nomor"));

  if (!Number.isSafeInteger(nomor) || nomor < 1) {
    throw new Error("Nomor pesanan tidak valid.");
  }

  const namaSaya = (await cookies()).get("nama")?.value.trim();

  if (!namaSaya) {
    throw new Error("Tidak berwenang membatalkan pesanan.");
  }

  const { data, error } = await supabaseAdmin
    .from("pesanan")
    .delete()
    .eq("nomor", nomor)
    .eq("nama", namaSaya)
    .select("nomor");

  if (error) {
    throw new Error("Gagal membatalkan pesanan: " + error.message);
  }

  if (!data.length) {
    throw new Error("Pesanan tidak ditemukan atau bukan milikmu.");
  }

  revalidatePath("/pesanan");
}
import { ambilEvents } from "@/data/data/ambil";

export async function GET() {
return Response.json(await ambilEvents());
}
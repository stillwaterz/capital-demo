import { fetchUsdZmw } from "@/lib/data/fx";

export const revalidate = 1800;

export async function GET(): Promise<Response> {
  const data = await fetchUsdZmw();
  if (!data) return new Response("Unavailable", { status: 503 });
  return Response.json(data);
}

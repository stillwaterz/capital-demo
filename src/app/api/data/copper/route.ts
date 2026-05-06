import { fetchCopperPrice } from "@/lib/data/copper";

export const revalidate = 1800;

export async function GET(): Promise<Response> {
  const data = await fetchCopperPrice();
  if (!data) return new Response("Unavailable", { status: 503 });
  return Response.json(data);
}

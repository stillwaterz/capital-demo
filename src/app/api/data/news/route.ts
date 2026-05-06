import { fetchZambianNews } from "@/lib/data/news";

export const revalidate = 1800;

export async function GET(): Promise<Response> {
  const items = await fetchZambianNews();
  return Response.json(items);
}

import { prisma } from "../lib/prisma";
import { cached } from "../lib/cache";

export async function getSettings() {
  return cached("settings:all", async () => {
    const client = await prisma();
    const settings = await client.setting.findMany();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, any>);
  }, 60_000); // cache 60s — settings change rarely
}

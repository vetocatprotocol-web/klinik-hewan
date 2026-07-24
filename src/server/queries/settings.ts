import { prisma } from "../lib/prisma";

export async function getSettings() {
  const client = await prisma();
  const settings = await client.setting.findMany();
  return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, any>);
}

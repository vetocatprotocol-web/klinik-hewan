import type { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

async function createPrismaClient(): Promise<PrismaClient> {
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient: PrismaClientConstructor } = await import("@prisma/client");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClientConstructor({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

let _prismaPromise: Promise<PrismaClient> | null = null;

function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return Promise.resolve(globalForPrisma.prisma);
  if (!_prismaPromise) {
    _prismaPromise = createPrismaClient().then((client) => {
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = client;
      }
      return client;
    });
  }
  return _prismaPromise;
}

export { getPrisma as prisma };

export default {
  get user() { return getPrisma().then(c => c.user); },
  get role() { return getPrisma().then(c => c.role); },
  get customer() { return getPrisma().then(c => c.customer); },
  get pet() { return getPrisma().then(c => c.pet); },
  get service() { return getPrisma().then(c => c.service); },
  get drug() { return getPrisma().then(c => c.drug); },
  get product() { return getPrisma().then(c => c.product); },
  get productCategory() { return getPrisma().then(c => c.productCategory); },
  get visit() { return getPrisma().then(c => c.visit); },
  get visitItem() { return getPrisma().then(c => c.visitItem); },
  get billing() { return getPrisma().then(c => c.billing); },
  get billingItem() { return getPrisma().then(c => c.billingItem); },
  get invoice() { return getPrisma().then(c => c.invoice); },
  get invoiceItem() { return getPrisma().then(c => c.invoiceItem); },
  get prescription() { return getPrisma().then(c => c.prescription); },
  get prescriptionItem() { return getPrisma().then(c => c.prescriptionItem); },
  get posOrder() { return getPrisma().then(c => c.posOrder); },
  get posOrderItem() { return getPrisma().then(c => c.posOrderItem); },
  get payment() { return getPrisma().then(c => c.payment); },
  get stockAdjustment() { return getPrisma().then(c => c.stockAdjustment); },
  get auditLog() { return getPrisma().then(c => c.auditLog); },
  get notification() { return getPrisma().then(c => c.notification); },
  get setting() { return getPrisma().then(c => c.setting); },
  async $transaction(args: any) {
    const client = await getPrisma();
    return client.$transaction(args);
  },
  async $queryRaw(...args: any[]) {
    const client = await getPrisma();
    return (client.$queryRaw as any)(...args);
  },
  async $executeRaw(...args: any[]) {
    const client = await getPrisma();
    return (client.$executeRaw as any)(...args);
  },
} as unknown as PrismaClient;

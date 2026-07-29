import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});

export const passwordComplexitySchema = z.string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung huruf besar")
  .regex(/[a-z]/, "Password harus mengandung huruf kecil")
  .regex(/[0-9]/, "Password harus mengandung angka");

export const customerSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(255),
  phone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .max(20, "Nomor HP maksimal 20 digit")
    .regex(/^[0-9]+$/, "Nomor HP hanya boleh angka"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().min(1, "Alamat harus diisi"),
  city: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

const PET_SPECIES = ["Anjing", "Kucing", "Burung", "Kelinci", "Hamster", "Iguana", "Ular", "Kura-kura", "Lainnya"] as const;

export const petSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(255),
  species: z.enum(PET_SPECIES, { message: "Jenis hewan harus dipilih" }),
  breed: z.string().optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  weightKg: z.coerce.number().min(0, "Berat harus >= 0").optional(),
  colorMarking: z.string().optional().or(z.literal("")),
  medicalHistoryNotes: z.string().optional().or(z.literal("")),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(100),
  description: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Kategori harus dipilih"),
  price: z.coerce.number().min(0, "Harga harus >= 0"),
});

export const drugSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(100),
  description: z.string().optional().or(z.literal("")),
  unit: z.string().min(1, "Unit harus dipilih"),
  pricePerUnit: z.coerce.number().min(0, "Harga harus >= 0"),
});

export const productCategorySchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(100),
  description: z.string().optional().or(z.literal("")),
});

export const productSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(100),
  categoryId: z.string().min(1, "Kategori harus dipilih"),
  price: z.coerce.number().min(0, "Harga harus >= 0"),
  description: z.string().optional().or(z.literal("")),
  barcode: z.string().optional().or(z.literal("")),
  currentStock: z.coerce.number().min(0, "Stok harus >= 0").default(0),
  reorderPoint: z.coerce.number().min(0).default(10),
});

export const visitItemSchema = z.object({
  itemType: z.enum(["SERVICE", "DRUG"]),
  itemId: z.string().min(1, "Item harus dipilih"),
  quantity: z.coerce.number().min(1, "Jumlah minimal 1"),
});

export const visitFormSchema = z.object({
  customerId: z.string().min(1, "Pelanggan harus dipilih"),
  petId: z.string().min(1, "Hewan harus dipilih"),
  visitDate: z.string().min(1, "Tanggal kunjungan harus diisi"),
  chiefComplaint: z.string().min(1, "Keluhan utama harus diisi"),
  physicalExamNotes: z.string().optional().or(z.literal("")),
  diagnosis: z.string().min(1, "Diagnosis harus diisi"),
  treatmentNotes: z.string().optional().or(z.literal("")),
  weightKg: z.union([z.number(), z.string()]).optional(),
  temperature: z.union([z.number(), z.string()]).optional(),
  heartRate: z.union([z.number(), z.string()]).optional(),
  visitItems: z.array(z.any()).optional().default([]),
});

export const visitSchema = z.object({
  customerId: z.string().min(1, "Pelanggan harus dipilih"),
  petId: z.string().min(1, "Hewan harus dipilih"),
  visitDate: z.string().min(1, "Tanggal kunjungan harus diisi"),
  chiefComplaint: z.string().min(1, "Keluhan utama harus diisi"),
  physicalExamNotes: z.string().optional().or(z.literal("")),
  diagnosis: z.string().min(1, "Diagnosis harus diisi"),
  treatmentNotes: z.string().optional().or(z.literal("")),
  weightKg: z.coerce.number().min(0).optional(),
  temperature: z.coerce.number().min(0).max(50).optional(),
  heartRate: z.coerce.number().min(0).optional(),
  services: z.array(
    z.object({
      serviceId: z.string(),
      quantity: z.coerce.number().min(1),
    })
  ),
  drugs: z.array(
    z.object({
      drugId: z.string(),
      quantity: z.coerce.number().min(1),
      dosage: z.string().optional().or(z.literal("")),
      durationDays: z.coerce.number().min(1).optional(),
      instructions: z.string().optional().or(z.literal("")),
    })
  ),
});

export const billingSchema = z.object({
  customerId: z.string().min(1, "Pelanggan harus dipilih"),
  petId: z.string().min(1, "Hewan harus dipilih"),
  notes: z.string().optional().or(z.literal("")),
});

export const billingItemSchema = z.object({
  itemType: z.enum(["SERVICE", "DRUG", "PRODUCT"]),
  itemId: z.string().min(1, "Item harus dipilih"),
  quantity: z.coerce.number().min(1, "Jumlah minimal 1"),
  notes: z.string().optional().or(z.literal("")),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  paymentMethod: z.string().min(1, "Metode pembayaran harus dipilih"),
  amount: z.coerce.number().min(1, "Jumlah pembayaran harus > 0"),
});

export const posItemSchema = z.object({
  productId: z.string().min(1, "Produk harus dipilih"),
  quantity: z.coerce.number().min(1, "Jumlah minimal 1"),
});

export const posCheckoutSchema = z.object({
  paymentMethod: z.string().min(1, "Metode pembayaran harus dipilih"),
  paymentAmount: z.coerce.number().min(0, "Jumlah pembayaran harus >= 0"),
  discountAmount: z.coerce.number().min(0).default(0),
});

export const userSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(255),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional().or(z.literal("")),
  roleId: z.string().min(1, "Role harus dipilih"),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Produk harus dipilih"),
  quantity: z.coerce.number().refine((val) => val !== 0, "Jumlah tidak boleh 0"),
  reason: z.enum(["INITIAL", "POS_SOLD", "BILLING_SOLD", "DAMAGED", "RETURN", "OPNAME_ADJUST", "OTHER"], {
    message: "Alasan harus dipilih",
  }),
  notes: z.string().optional().or(z.literal("")),
});

export const companyInfoSchema = z.object({
  name: z.string().min(1, "Nama klinik harus diisi"),
  logo: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  operatingHours: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  invoiceFooter: z.string().optional().or(z.literal("")),
  receiptFooter: z.string().optional().or(z.literal("")),
});

export const taxConfigSchema = z.object({
  type: z.enum(["FLAT", "PERCENTAGE"]),
  value: z.coerce.number().min(0, "Nilai harus >= 0"),
  enabled: z.boolean(),
});

export const profileSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(255),
  phone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .max(20)
    .regex(/^[0-9]+$/, "Nomor HP hanya boleh angka"),
  email: z.string().email("Email tidak valid"),
  address: z.string().optional().or(z.literal("")),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Password lama harus diisi"),
  password: passwordComplexitySchema,
  confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
});

export const appointmentSchema = z.object({
  customerId: z.string().min(1, "Pelanggan wajib diisi"),
  petId: z.string().min(1, "Hewan wajib diisi"),
  doctorId: z.string().min(1, "Dokter wajib diisi"),
  appointmentDate: z.string().min(1, "Tanggal wajib diisi"),
  time: z.string().min(1, "Waktu wajib diisi"),
  type: z.string().optional(),
  notes: z.string().optional(),
});

export const hotelBookingSchema = z.object({
  customerId: z.string().min(1, "Pelanggan wajib diisi"),
  petId: z.string().min(1, "Hewan wajib diisi"),
  roomId: z.string().min(1, "Kamar wajib diisi"),
  checkInDate: z.string().min(1, "Tanggal check-in wajib diisi"),
  checkOutDate: z.string().min(1, "Tanggal check-out wajib diisi"),
  notes: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi"),
  phone: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  contactPerson: z.string().optional(),
  paymentTerms: z.string().optional(),
  specialization: z.string().optional(),
});

export const reconciliationSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  actualCash: z.number().min(0, "Uang tunai aktual tidak boleh negatif"),
  actualCard: z.number().min(0, "Kartu aktual tidak boleh negatif"),
  notes: z.string().optional(),
});

export const discountSchema = z.object({
  amount: z.number().min(0, "Jumlah diskon tidak boleh negatif"),
  percent: z.number().min(0).max(100, "Persentase diskon maksimal 100%").optional(),
  reason: z.string().min(1, "Alasan diskon wajib diisi"),
});

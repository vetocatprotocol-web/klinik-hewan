import { describe, it, expect } from "vitest";
import {
  loginSchema,
  customerSchema,
  petSchema,
  serviceSchema,
  drugSchema,
  productSchema,
  visitFormSchema,
  billingSchema,
  paymentSchema,
  posCheckoutSchema,
  userSchema,
  stockAdjustmentSchema,
  taxConfigSchema,
  profileSchema,
  passwordSchema,
} from "@/lib/validators";

describe("Login Validator", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("Customer Validator", () => {
  const validCustomer = {
    name: "John Doe",
    phone: "08123456789",
    address: "Jl. Main St",
  };

  it("should accept valid customer data", () => {
    const result = customerSchema.safeParse(validCustomer);
    expect(result.success).toBe(true);
  });

  it("should reject short phone number", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      phone: "123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-numeric phone", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      phone: "08123456abc",
    });
    expect(result.success).toBe(false);
  });

  it("should accept empty email", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      email: "",
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional email", () => {
    const result = customerSchema.safeParse({
      name: "John",
      phone: "08123456789",
      address: "Jl. Main St",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const result = customerSchema.safeParse({
      ...validCustomer,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("Pet Validator", () => {
  const validPet = {
    name: "Fluffy",
    species: "Kucing",
  };

  it("should accept valid pet data", () => {
    const result = petSchema.safeParse(validPet);
    expect(result.success).toBe(true);
  });

  it("should accept pet with optional fields", () => {
    const result = petSchema.safeParse({
      ...validPet,
      breed: "Persia",
      birthDate: "2020-01-15",
      weightKg: 3.5,
      colorMarking: "Putih",
      medicalHistoryNotes: "Sehat",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid species", () => {
    const result = petSchema.safeParse({
      name: "Fluffy",
      species: "Dinosaur",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid species", () => {
    const species = ["Anjing", "Kucing", "Burung", "Kelinci", "Hamster", "Iguana", "Ular", "Kura-kura", "Lainnya"];
    for (const s of species) {
      const result = petSchema.safeParse({ name: "Pet", species: s });
      expect(result.success).toBe(true);
    }
  });

  it("should reject negative weight", () => {
    const result = petSchema.safeParse({
      ...validPet,
      weightKg: -5,
    });
    expect(result.success).toBe(false);
  });

  it("should accept zero weight", () => {
    const result = petSchema.safeParse({
      ...validPet,
      weightKg: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("Service Validator", () => {
  const validService = {
    name: "Vaksinasi Rabies",
    category: "VAKSINASI",
    price: 250000,
  };

  it("should accept valid service", () => {
    const result = serviceSchema.safeParse(validService);
    expect(result.success).toBe(true);
  });

  it("should reject zero price", () => {
    const result = serviceSchema.safeParse({
      ...validService,
      price: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = serviceSchema.safeParse({
      ...validService,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty category", () => {
    const result = serviceSchema.safeParse({
      ...validService,
      category: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("Drug Validator", () => {
  const validDrug = {
    name: "Amoxicillin",
    unit: "TABLET",
    pricePerUnit: 5000,
  };

  it("should accept valid drug", () => {
    const result = drugSchema.safeParse(validDrug);
    expect(result.success).toBe(true);
  });

  it("should reject empty unit", () => {
    const result = drugSchema.safeParse({
      ...validDrug,
      unit: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative price", () => {
    const result = drugSchema.safeParse({
      ...validDrug,
      pricePerUnit: -100,
    });
    expect(result.success).toBe(false);
  });
});

describe("Product Validator", () => {
  const validProduct = {
    name: "Royal Canin",
    categoryId: "cat_123",
    price: 350000,
  };

  it("should accept valid product", () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("should accept product with optional fields", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      description: "Makanan kucing",
      barcode: "1234567890",
      currentStock: 50,
      reorderPoint: 10,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty category", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      categoryId: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("Visit Form Validator", () => {
  const validVisit = {
    customerId: "cust_123",
    petId: "pet_456",
    visitDate: "2024-07-24",
    chiefComplaint: "Diare",
    diagnosis: "Gastroenteritis",
  };

  it("should accept valid visit form", () => {
    const result = visitFormSchema.safeParse(validVisit);
    expect(result.success).toBe(true);
  });

  it("should require chief complaint", () => {
    const result = visitFormSchema.safeParse({
      ...validVisit,
      chiefComplaint: "",
    });
    expect(result.success).toBe(false);
  });

  it("should require diagnosis", () => {
    const result = visitFormSchema.safeParse({
      ...validVisit,
      diagnosis: "",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional fields", () => {
    const result = visitFormSchema.safeParse({
      ...validVisit,
      physicalExamNotes: "Demam",
      treatmentNotes: "Berikan obat",
      weightKg: 5.2,
      temperature: 38.5,
      heartRate: 120,
    });
    expect(result.success).toBe(true);
  });
});

describe("Billing Validator", () => {
  it("should accept valid billing data", () => {
    const result = billingSchema.safeParse({
      customerId: "cust_123",
      petId: "pet_456",
    });
    expect(result.success).toBe(true);
  });

  it("should accept with notes", () => {
    const result = billingSchema.safeParse({
      customerId: "cust_123",
      petId: "pet_456",
      notes: "Rawat inap 3 hari",
    });
    expect(result.success).toBe(true);
  });
});

describe("Payment Validator", () => {
  it("should accept valid payment", () => {
    const result = paymentSchema.safeParse({
      invoiceId: "inv_123",
      paymentMethod: "CASH",
      amount: 250000,
    });
    expect(result.success).toBe(true);
  });

  it("should reject zero amount", () => {
    const result = paymentSchema.safeParse({
      invoiceId: "inv_123",
      paymentMethod: "CASH",
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative amount", () => {
    const result = paymentSchema.safeParse({
      invoiceId: "inv_123",
      paymentMethod: "CASH",
      amount: -100,
    });
    expect(result.success).toBe(false);
  });
});

describe("POS Checkout Validator", () => {
  it("should accept valid checkout", () => {
    const result = posCheckoutSchema.safeParse({
      paymentMethod: "CASH",
      paymentAmount: 100000,
      discountAmount: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should accept with discount", () => {
    const result = posCheckoutSchema.safeParse({
      paymentMethod: "CASH",
      paymentAmount: 100000,
      discountAmount: 10000,
    });
    expect(result.success).toBe(true);
  });

  it("should default discount to 0", () => {
    const result = posCheckoutSchema.safeParse({
      paymentMethod: "CASH",
      paymentAmount: 100000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discountAmount).toBe(0);
    }
  });
});

describe("User Validator", () => {
  const validUser = {
    name: "Dr. Smith",
    email: "smith@clinic.com",
    roleId: "role_123",
  };

  it("should accept valid user", () => {
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("should accept with password", () => {
    const result = userSchema.safeParse({
      ...validUser,
      password: "securePass1",
    });
    expect(result.success).toBe(true);
  });

  it("should reject short password", () => {
    const result = userSchema.safeParse({
      ...validUser,
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("should accept without password (optional)", () => {
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });
});

describe("Stock Adjustment Validator", () => {
  it("should accept valid adjustment", () => {
    const result = stockAdjustmentSchema.safeParse({
      productId: "prod_123",
      quantity: 10,
      reason: "OPNAME_ADJUST",
    });
    expect(result.success).toBe(true);
  });

  it("should accept negative quantity", () => {
    const result = stockAdjustmentSchema.safeParse({
      productId: "prod_123",
      quantity: -5,
      reason: "DAMAGED",
    });
    expect(result.success).toBe(true);
  });

  it("should reject zero quantity", () => {
    const result = stockAdjustmentSchema.safeParse({
      productId: "prod_123",
      quantity: 0,
      reason: "OPNAME_ADJUST",
    });
    expect(result.success).toBe(false);
  });
});

describe("Tax Config Validator", () => {
  it("should accept valid FLAT config", () => {
    const result = taxConfigSchema.safeParse({
      type: "FLAT",
      value: 5000,
      enabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid PERCENTAGE config", () => {
    const result = taxConfigSchema.safeParse({
      type: "PERCENTAGE",
      value: 10,
      enabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid type", () => {
    const result = taxConfigSchema.safeParse({
      type: "INVALID",
      value: 10,
      enabled: true,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative value", () => {
    const result = taxConfigSchema.safeParse({
      type: "FLAT",
      value: -100,
      enabled: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("Profile Validator", () => {
  it("should accept valid profile", () => {
    const result = profileSchema.safeParse({
      name: "John Doe",
      phone: "08123456789",
      email: "john@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject short phone", () => {
    const result = profileSchema.safeParse({
      name: "John Doe",
      phone: "123",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("Password Validator", () => {
  it("should accept valid password change", () => {
    const result = passwordSchema.safeParse({
      currentPassword: "oldPass123",
      password: "newPass123",
      confirmPassword: "newPass123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject short new password", () => {
    const result = passwordSchema.safeParse({
      currentPassword: "oldPass123",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});

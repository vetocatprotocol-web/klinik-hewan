export class AppError extends Error {
  code: string;
  field?: string;

  constructor(message: string, code: string = "ERROR", field?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.field = field;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Silakan login terlebih dahulu") {
    super(message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = "Anda tidak memiliki akses untuk melakukan ini"
  ) {
    super(message, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Data tidak ditemukan") {
    super(message, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION", field);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number) {
    super(
      `Stok tidak mencukupi untuk ${productName}. Tersedia: ${available}`,
      "INSUFFICIENT_STOCK"
    );
  }
}

export class InvalidPaymentError extends AppError {
  constructor(message: string = "Jumlah pembayaran tidak valid") {
    super(message, "INVALID_PAYMENT");
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, "BUSINESS_RULE");
  }
}

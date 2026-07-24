import { test, expect } from "@playwright/test";

test.describe("Customer Management", () => {
  test("should show customer list page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "owner@klinikhewan.com");
    await page.fill('input[name="password"]', "Owner123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto("/customers");
    await expect(page.locator("text=Pelanggan")).toBeVisible();
  });

  test("should navigate to create customer form", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "owner@klinikhewan.com");
    await page.fill('input[name="password"]', "Owner123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto("/customers/new");
    await expect(page.locator("text=Tambah Pelanggan")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("should show sidebar navigation for Owner", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "owner@klinikhewan.com");
    await page.fill('input[name="password"]', "Owner123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Pelanggan")).toBeVisible();
    await expect(page.locator("text=Kunjungan")).toBeVisible();
    await expect(page.locator("text=POS")).toBeVisible();
  });

  test("should redirect customer to portal", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "customer@klinikhewan.com");
    await page.fill('input[name="password"]', "Customer123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/portal\/dashboard/);

    expect(page.url()).toContain("/portal/dashboard");
  });
});

test.describe("Dashboard", () => {
  test("should show dashboard stats", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "owner@klinikhewan.com");
    await page.fill('input[name="password"]', "Owner123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await expect(page.locator("text=Dashboard")).toBeVisible();
  });
});

test.describe("Master Data", () => {
  test("should show services page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "owner@klinikhewan.com");
    await page.fill('input[name="password"]', "Owner123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto("/master/services");
    await expect(page.locator("text=Layanan")).toBeVisible();
  });

  test("should show drugs page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "owner@klinikhewan.com");
    await page.fill('input[name="password"]', "Owner123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto("/master/drugs");
    await expect(page.locator("text=Obat")).toBeVisible();
  });

  test("should show products page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "owner@klinikhewan.com");
    await page.fill('input[name="password"]', "Owner123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto("/master/products");
    await expect(page.locator("text=Produk")).toBeVisible();
  });
});

test.describe("Portal", () => {
  test("should show portal dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "customer@klinikhewan.com");
    await page.fill('input[name="password"]', "Customer123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/portal\/dashboard/);

    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("should show portal navigation", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "customer@klinikhewan.com");
    await page.fill('input[name="password"]', "Customer123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/portal\/dashboard/);

    await expect(page.locator("text=Hewan Saya")).toBeVisible();
    await expect(page.locator("text=Riwayat")).toBeVisible();
  });
});

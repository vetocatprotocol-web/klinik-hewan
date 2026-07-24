"use client";

import { useState, useEffect } from "react";
import { fetchActiveProducts, fetchProductCategories, fetchSettings } from "@/server/actions/queries";
import { createPosOrder, addPosItem, checkoutPos } from "@/server/actions/pos";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShoppingCart, Trash2, Plus, Minus, Receipt, Printer } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  currentStock: number;
  category: { id: string; name: string };
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetails {
  orderNumber: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  paymentAmount: number;
  changeAmount: number;
  items: CartItem[];
}

interface TaxConfig {
  type: string;
  value: number;
  enabled: boolean;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<OrderDetails | null>(null);
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({ type: "FLAT", value: 0, enabled: false });
  const [clinicName, setClinicName] = useState("Klinik Hewan");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [productsData, categoriesData, settingsData] = await Promise.all([
          fetchActiveProducts(),
          fetchProductCategories(),
          fetchSettings(),
        ]);
        setProducts(productsData as unknown as Product[]);
        setCategories(categoriesData as { id: string; name: string }[]);

        const tc = settingsData.tax_config as TaxConfig | undefined;
        if (tc) setTaxConfig(tc);

        const ci = settingsData.company_info as any;
        if (ci?.name) setClinicName(ci.name);
        if (ci?.receiptFooter) setReceiptFooter(ci.receiptFooter);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "all" || p.category.id === selectedCategory;
    return matchSearch && matchCategory;
  });

  const recalculateTotals = (items: CartItem[], disc: number) => {
    const sub = items.reduce((sum, item) => sum + item.subtotal, 0);
    setSubtotal(sub);
    let tax = 0;
    if (taxConfig.enabled) {
      if (taxConfig.type === "PERCENTAGE") {
        tax = Math.round(sub * (taxConfig.value / 100));
      } else {
        tax = taxConfig.value;
      }
    }
    setTaxAmount(tax);
    const t = sub + tax - disc;
    setTotal(t);
    if (paymentAmount) {
      const paid = parseFloat(paymentAmount) || 0;
      setChangeAmount(Math.max(0, paid - t));
    }
  };

  const handleAddToCart = (product: Product) => {
    setCartError(null);
    if (product.currentStock <= 0) {
      setCartError(`${product.name} stok habis`);
      return;
    }
    const existing = cartItems.find((c) => c.productId === product.id);
    let newItems: CartItem[];
    if (existing) {
      if (existing.quantity >= product.currentStock) {
        setCartError(`Stok ${product.name} tidak mencukupi. Tersedia: ${product.currentStock}`);
        return;
      }
      newItems = cartItems.map((c) =>
        c.productId === product.id
          ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.unitPrice }
          : c
      );
    } else {
      newItems = [...cartItems, {
        productId: product.id,
        name: product.name,
        unitPrice: Number(product.price),
        quantity: 1,
        subtotal: Number(product.price),
      }];
    }
    setCartItems(newItems);
    recalculateTotals(newItems, discount);
  };

  const handleIncrement = (productId: string) => {
    setCartError(null);
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const item = cartItems.find((c) => c.productId === productId);
    if (item && item.quantity >= product.currentStock) {
      setCartError(`Stok ${product.name} tidak mencukupi. Tersedia: ${product.currentStock}`);
      return;
    }
    const newItems = cartItems.map((c) =>
      c.productId === productId
        ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.unitPrice }
        : c
    );
    setCartItems(newItems);
    recalculateTotals(newItems, discount);
  };

  const handleDecrement = (productId: string) => {
    const item = cartItems.find((c) => c.productId === productId);
    if (!item) return;
    if (item.quantity <= 1) {
      handleRemoveFromCart(productId);
      return;
    }
    const newItems = cartItems.map((c) =>
      c.productId === productId
        ? { ...c, quantity: c.quantity - 1, subtotal: (c.quantity - 1) * c.unitPrice }
        : c
    );
    setCartItems(newItems);
    recalculateTotals(newItems, discount);
  };

  const handleRemoveFromCart = (productId: string) => {
    const newItems = cartItems.filter((c) => c.productId !== productId);
    setCartItems(newItems);
    recalculateTotals(newItems, discount);
  };

  const handleDiscountChange = (value: string) => {
    const disc = parseFloat(value) || 0;
    setDiscount(disc);
    recalculateTotals(cartItems, disc);
  };

  const handlePaymentAmountChange = (value: string) => {
    setPaymentAmount(value);
    const paid = parseFloat(value) || 0;
    setChangeAmount(Math.max(0, paid - total));
  };

  const handleCheckout = async () => {
    setCartError(null);
    if (cartItems.length === 0) return;
    const paid = parseFloat(paymentAmount) || 0;
    if (paid < total) {
      setCartError("Jumlah pembayaran kurang dari total");
      return;
    }
    setProcessing(true);
    try {
      const orderResult = await createPosOrder();
      if (!orderResult.success || !orderResult.data) {
        setCartError("Gagal membuat pesanan");
        return;
      }
      const orderId = orderResult.data;
      for (const item of cartItems) {
        const addResult = await addPosItem(orderId, item.productId, item.quantity);
        if (!addResult.success) {
          setCartError("Gagal menambahkan item ke pesanan");
          return;
        }
      }
      const checkoutResult = await checkoutPos(orderId, paymentMethod, paid, discount);
      if (!checkoutResult.success) {
        setCartError("Gagal memproses pembayaran");
        return;
      }
      setReceiptDetails({
        orderNumber: orderId, subtotal, taxAmount, discountAmount: discount,
        total, paymentMethod, paymentAmount: paid, changeAmount,
        items: [...cartItems],
      });
      setReceiptOpen(true);
      resetCart();
    } catch (e: any) {
      setCartError(e?.message || "Terjadi kesalahan saat memproses");
    } finally {
      setProcessing(false);
    }
  };

  const resetCart = () => {
    setCartItems([]);
    setSubtotal(0);
    setTaxAmount(0);
    setDiscount(0);
    setTotal(0);
    setPaymentMethod("CASH");
    setPaymentAmount("");
    setChangeAmount(0);
    setCartError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <p className="text-sm text-muted-foreground">Transaksi penjualan produk</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="all">Semua</TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Tidak ada produk ditemukan</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1">{product.name}</h3>
                    <p className="text-lg font-bold text-primary">{formatCurrency(Number(product.price))}</p>
                    <p className="text-xs text-muted-foreground">Stok: {product.currentStock}</p>
                    <Button size="sm" className="mt-2 w-full" disabled={product.currentStock <= 0} onClick={() => handleAddToCart(product)}>
                      <Plus className="mr-1 h-3 w-3" />{product.currentStock <= 0 ? "Habis" : "Tambah"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />Keranjang
                {cartItems.length > 0 && <Badge variant="secondary">{cartItems.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartError && (
                <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                  {cartError}
                </div>
              )}
              {cartItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Keranjang kosong</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDecrement(item.productId)}><Minus className="h-3 w-3" /></Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleIncrement(item.productId)}><Plus className="h-3 w-3" /></Button>
                          <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFromCart(item.productId)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    {taxAmount > 0 && <div className="flex justify-between text-sm"><span>Pajak ({taxConfig.type === "PERCENTAGE" ? `${taxConfig.value}%` : "Flat"})</span><span>{formatCurrency(taxAmount)}</span></div>}
                    <div className="flex items-center justify-between text-sm">
                      <Label htmlFor="discount">Diskon</Label>
                      <Input id="discount" type="number" min="0" value={discount || ""} onChange={(e) => handleDiscountChange(e.target.value)} className="h-8 w-28 text-right text-sm" />
                    </div>
                    <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Metode Pembayaran</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment">Jumlah Bayar</Label>
                    <Input id="payment" type="number" min="0" value={paymentAmount} onChange={(e) => handlePaymentAmountChange(e.target.value)} placeholder="0" />
                    {changeAmount > 0 && <p className="text-sm text-green-600">Kembalian: {formatCurrency(changeAmount)}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={processing || cartItems.length === 0 || (parseFloat(paymentAmount) || 0) < total} onClick={handleCheckout}>
                      <Receipt className="mr-2 h-4 w-4" />{processing ? "Memproses..." : "Bayar"}
                    </Button>
                    <Button variant="outline" onClick={resetCart}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Struk Pembayaran</DialogTitle></DialogHeader>
          {receiptDetails && (
            <div className="space-y-3 text-sm">
              <div className="text-center">
                <p className="font-bold">{clinicName}</p>
                <p className="text-xs text-muted-foreground">Terima kasih atas pembelian Anda</p>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                No: {receiptDetails.orderNumber}
              </div>
              <div className="border-t pt-3 space-y-1">
                {receiptDetails.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-xs">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(receiptDetails.subtotal)}</span></div>
                {receiptDetails.taxAmount > 0 && <div className="flex justify-between"><span>Pajak</span><span>{formatCurrency(receiptDetails.taxAmount)}</span></div>}
                {receiptDetails.discountAmount > 0 && <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(receiptDetails.discountAmount)}</span></div>}
                <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{formatCurrency(receiptDetails.total)}</span></div>
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between"><span>Bayar</span><span>{formatCurrency(receiptDetails.paymentAmount)}</span></div>
                <div className="flex justify-between"><span>Kembalian</span><span>{formatCurrency(receiptDetails.changeAmount)}</span></div>
              </div>
              {receiptFooter && (
                <div className="border-t pt-3 text-center text-xs text-muted-foreground">
                  {receiptFooter}
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Cetak Struk</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PawPrint, ArrowLeft, CheckCircle, Loader2, AlertCircle, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(true);

  // Validate token on mount
  useEffect(() => {
    if (!token || !email) {
      setError("Link reset password tidak valid. Silakan minta reset password baru.");
      setValidating(false);
      return;
    }
    setValidating(false);
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password harus mengandung huruf besar");
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password harus mengandung huruf kecil");
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password harus mengandung angka");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Gagal mereset password");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <div className="rounded-lg bg-primary/10 p-2">
            <PawPrint className="h-6 w-6 text-primary" />
          </div>
          <span className="text-2xl font-bold">PetCare</span>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Password Berhasil Diubah</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Password Anda telah berhasil diubah. Silakan login dengan password baru Anda.
                </p>
              </div>
              <Button asChild className="w-full mt-4">
                <Link href="/login">Login Sekarang</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <div className="rounded-lg bg-primary/10 p-2">
          <PawPrint className="h-6 w-6 text-primary" />
        </div>
        <span className="text-2xl font-bold">PetCare</span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Reset Password
          </CardTitle>
          <CardDescription>
            Masukkan password baru untuk akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !success && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Password tidak cocok</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>

            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Login
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { signIn, useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getDashboardPath(role?: string): string {
  if (role === "CUSTOMER") return "/portal/dashboard";
  return "/dashboard";
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [prefetched, setPrefetched] = useState(false);

  // Prefetch dashboard when user starts typing credentials
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (!prefetched && e.target.value.length > 3) {
      setPrefetched(true);
      router.prefetch("/dashboard");
      router.prefetch("/portal/dashboard");
    }
  }, [prefetched, router]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      const role = (session.user as any)?.role;
      window.location.href = getDashboardPath(role);
    }
  }, [status, session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah");
        setIsPending(false);
        return;
      }

      // Login succeeded — fetch session to determine role-based redirect.
      const newSession = await getSession();
      const role = (newSession?.user as any)?.role;
      window.location.href = getDashboardPath(role);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        <PawPrint className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">Klinik Hewan PetCare</span>
      </div>

      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Masuk</CardTitle>
          <CardDescription>
            Masukkan kredensial Anda untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@klinik.com"
                autoComplete="email"
                disabled={isPending}
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                autoComplete="current-password"
                disabled={isPending}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

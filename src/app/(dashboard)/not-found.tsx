import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center text-center space-y-4 py-8">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Halaman Tidak Ditemukan</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Halaman yang Anda cari tidak ada atau telah dipindahkan.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

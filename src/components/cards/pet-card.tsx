import { PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PetCardProps {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  weightKg?: number | null;
  status: string;
  visitCount?: number;
}

export function PetCard({
  name,
  species,
  breed,
  weightKg,
  status,
  visitCount,
}: PetCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <PawPrint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{name}</h3>
              <p className="text-sm text-muted-foreground">
                {species}{breed ? ` - ${breed}` : ""}
              </p>
            </div>
          </div>
          <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
            {status === "ACTIVE" ? "Aktif" : "Diarsipkan"}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          {weightKg && <span>Berat: {weightKg} kg</span>}
          {visitCount !== undefined && <span>{visitCount} kunjungan</span>}
        </div>
      </CardContent>
    </Card>
  );
}

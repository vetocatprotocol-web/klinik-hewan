import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

function Loading() {
  return <LoadingSkeleton />;
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      {children}
    </Suspense>
  );
}

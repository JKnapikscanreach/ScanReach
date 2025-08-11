"use client";

import { Providers } from "../providers";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Microsites from "@/pages-old/Microsites";

export default function MicrositesPage() {
  return (
    <Providers>
      <ProtectedRoute>
        <Microsites />
      </ProtectedRoute>
    </Providers>
  );
}

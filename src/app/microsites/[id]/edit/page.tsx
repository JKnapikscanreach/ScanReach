"use client";

import { Providers } from "../../../providers";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MicrositeEdit from "@/pages-old/MicrositeEdit";

export default function MicrositeEditPage() {
  return (
    <Providers>
      <ProtectedRoute>
        <MicrositeEdit />
      </ProtectedRoute>
    </Providers>
  );
}

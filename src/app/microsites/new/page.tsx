"use client";

import { Providers } from "../../providers";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import MicrositeEdit from "@/pages-old/MicrositeEdit";

export default function NewMicrositePage() {
  return (
    <Providers>
      <ProtectedRoute>
        <MicrositeEdit />
      </ProtectedRoute>
    </Providers>
  );
}

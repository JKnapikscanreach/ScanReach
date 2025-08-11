"use client";

import { Providers } from "../../providers";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import UserDetail from "@/pages-old/UserDetail";

export default function UserDetailPage() {
  return (
    <Providers>
      <ProtectedRoute requireAdmin>
        <UserDetail />
      </ProtectedRoute>
    </Providers>
  );
}

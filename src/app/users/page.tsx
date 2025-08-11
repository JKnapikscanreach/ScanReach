"use client";

import { Providers } from "../providers";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Users from "@/pages-old/Users";

export default function UsersPage() {
  return (
    <Providers>
      <ProtectedRoute requireAdmin>
        <Users />
      </ProtectedRoute>
    </Providers>
  );
}

"use client";

import { CircleAlert, RotateCw } from "lucide-react";
import { EmptyState } from "@/components/admin/Page";
import s from "@/components/admin/admin.module.css";

export default function AdminError({ retry }: { retry: () => void }) {
  return (
    <div className={s.page}>
      <EmptyState
        icon={CircleAlert}
        title="This page couldn’t load"
        action={
          <button type="button" className={s.button} onClick={() => retry()}>
            <RotateCw size={16} aria-hidden="true" /> Try again
          </button>
        }
      >
        The dashboard couldn’t reach Supabase. Check your connection and try
        again. Nothing you saved earlier was lost.
      </EmptyState>
    </div>
  );
}

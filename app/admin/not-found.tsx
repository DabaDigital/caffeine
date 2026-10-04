import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/admin/Page";
import s from "@/components/admin/admin.module.css";

export default function AdminNotFound() {
  return (
    <div className={s.page}>
      <EmptyState
        icon={SearchX}
        title="Nothing here"
        action={
          <Link href="/admin" className={s.button}>
            Back to the overview
          </Link>
        }
      >
        This item may have been deleted, or the link is out of date.
      </EmptyState>
    </div>
  );
}

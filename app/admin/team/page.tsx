import type { Metadata } from "next";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Hint, PageHeader } from "@/components/admin/Page";
import { RoleButton } from "@/components/admin/controls";
import { requireAdmin } from "@/lib/auth";
import { rows } from "@/lib/admin";
import { supabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import s from "@/components/admin/admin.module.css";
import { setRole } from "./actions";

export const metadata: Metadata = { title: "Team & roles" };

const joined = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Hosted projects live at <ref>.supabase.co; link straight to their users page.
const projectRef = supabaseUrl?.match(
  /^https:\/\/([a-z0-9]+)\.supabase\.co/,
)?.[1];
const usersUrl = projectRef
  ? `https://supabase.com/dashboard/project/${projectRef}/auth/users`
  : null;

export default async function TeamPage() {
  const viewer = await requireAdmin();
  const supabase = await createClient();
  const members = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("role")
    .order("created_at")
    .then(rows);

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Access"
        title="Team & roles"
        description="Only admins can open this dashboard. Everyone else who has an account sees “no access” when signing in."
      />
      <Hint icon={ShieldCheck}>
        Admins can change the whole menu and grant or remove admin access. At
        least one admin must always remain.
      </Hint>
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col">Role</th>
            <th scope="col">Joined</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const name = member.full_name || member.email || "Unnamed account";
            const isYou = member.id === viewer.id;
            return (
              <tr key={member.id}>
                <td className={s.cellMain}>
                  <div className={s.itemTitle}>
                    <span
                      className={`${s.thumb} ${s.thumbRound}`}
                      aria-hidden="true"
                    >
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <strong>
                        {name}
                        {isYou ? " (you)" : ""}
                      </strong>
                      {member.full_name && <span>{member.email}</span>}
                    </div>
                  </div>
                </td>
                <td data-label="Role">
                  <span
                    className={`${s.pill} ${member.role === "admin" ? s.pillAdmin : ""}`}
                  >
                    {member.role === "admin" ? "Admin" : "No access"}
                  </span>
                </td>
                <td data-label="Joined">
                  {joined.format(new Date(member.created_at))}
                </td>
                <td className={s.cellActions}>
                  {isYou ? (
                    <span className={s.muted}>Signed in as you</span>
                  ) : (
                    <RoleButton
                      action={setRole}
                      userId={member.id}
                      role={member.role}
                      name={name}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <section
        className={`${s.card} ${s.panel}`}
        aria-labelledby="invite-title"
      >
        <h2 id="invite-title">Add a team member</h2>
        <ol className={s.steps}>
          <li>
            In Supabase, open Authentication → Users and choose{" "}
            <strong>Add user → Create new user</strong>. Tick “Auto Confirm
            User” and share the password with them privately.
          </li>
          <li>Refresh this page. They appear here with no access.</li>
          <li>
            Choose <strong>Make admin</strong>. They can now sign in at /login.
          </li>
        </ol>
        {usersUrl && (
          <a
            href={usersUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.buttonSecondary}
            style={{ justifySelf: "start" }}
          >
            <ExternalLink size={16} aria-hidden="true" /> Open Supabase users
          </a>
        )}
      </section>
    </div>
  );
}

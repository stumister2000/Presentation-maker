import { requireUser } from "@/server/auth";
import { SettingsView } from "@/components/app/settings-view";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const u = await requireUser();
  return <SettingsView user={u} />;
}

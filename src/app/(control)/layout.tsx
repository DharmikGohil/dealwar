import { ControlRoomShell } from "@/components/dashboard/control-room-shell";
import { requireUser } from "@/lib/session";

export default async function ControlRoomLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return <ControlRoomShell user={user}>{children}</ControlRoomShell>;
}

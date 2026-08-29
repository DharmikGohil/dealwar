import { redirect } from "next/navigation";

export default function LegacyJoinPage() {
  redirect("/sign-in?intent=brand&next=%2Fbrand%2Fentries%2Fnew");
}

import { redirect } from "next/navigation";

// The dashboard lives at /overview — the root just forwards there so there is
// no separate landing page.
export default function Home() {
  redirect("/overview");
}

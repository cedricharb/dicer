import { redirect } from "next/navigation";
import { getSession } from "@/utils/supabase/server";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dice-sets");
  } else {
    redirect("/sign-in");
  }
}

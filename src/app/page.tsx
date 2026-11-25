import { redirect } from "next/navigation";

// No sign-in and no pricing: the app opens straight to your decks.
export default function Root() {
  redirect("/home");
}

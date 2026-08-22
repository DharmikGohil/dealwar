import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <section className="error-poster"><span className="eyebrow">404 / off the board</span><strong>NO DEAL.</strong><h1>This page left the ring.</h1><p>The offer may have ended, moved, or never existed.</p><Link href="/"><ArrowLeft size={17} /> Return to the live board</Link></section>;
}

import type { Metadata } from "next";
import LiveRoom from "@/components/LiveRoom";

export const metadata: Metadata = {
  title: "Live Audio Room | Amebo 'n Tech",
  description:
    "Join Amebo 'n Tech live technology conversations. Listen, request to speak, and participate in live discussions.",
  alternates: {
    canonical: "/live"
  }
};

export const dynamic = "force-dynamic";

export default function LivePage() {
  return <LiveRoom />;
}

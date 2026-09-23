import { notFound } from "next/navigation";
import { getEnvironment } from "@/server/config/env";
import { isDesignLabAllowed } from "@/lib/design-lab";
import { DesignLab } from "@/components/design-lab/lab";
import "./lab.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Design Lab",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  if (!isDesignLabAllowed(getEnvironment())) notFound();
  return <DesignLab />;
}

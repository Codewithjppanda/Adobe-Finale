"use client";
import { Card } from "@/components/ui/card";

export default function DocumentList() {
  const docs = [
    { name: "South of France pdf", href: "/viewer/demo-south-of-france" },
    { name: "Training Manual pdf", href: "/viewer/training-manual" },
    { name: "Quarterrty Report pdf", href: "/viewer/quarterly-report" },
  ];
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Documents</h3>
      <div className="space-y-3">
        {docs.map((d) => (
          <a key={d.name} href={d.href}>
            <Card className="rounded-xl px-4 py-3 hover:bg-neutral-50 transition">
              {d.name}
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}



"use client";
import { Card } from "@/components/ui/card";
export default function InsightList() {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Insights</h3>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="rounded-xl px-4 py-3">
            <div className="h-2 w-3/4 bg-neutral-200 rounded mb-2" />
            <div className="h-2 w-2/4 bg-neutral-200 rounded" />
          </Card>
        ))}
      </div>
    </div>
  );
}



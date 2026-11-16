
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  bgColor,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-foreground">
            {value}
          </h3>
        </div>

        <div className={`rounded-xl p-3 ${bgColor}`}>
          <Icon size={25} className={color} />
        </div>
      </div>

      <p className="mt-4 text-xs text-muted">{description}</p>
    </div>
  );
}

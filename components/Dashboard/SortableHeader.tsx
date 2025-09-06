import { TableHead } from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
}

export default function SortableHeader({ 
  label, 
  sortKey, 
  sortConfig, 
  onSort 
}: SortableHeaderProps) {
  return (
    <TableHead
      onClick={() => onSort(sortKey)}
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className="w-3 h-3" />
        {sortConfig?.key === sortKey && (
          <span className="text-xs">
            {sortConfig.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </TableHead>
  );
}
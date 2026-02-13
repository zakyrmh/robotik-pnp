"use client";

import * as React from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  content: React.ReactNode;
}

interface ReorderListProps {
  items: Item[];
  onReorder: (newOrder: Item[]) => void;
  className?: string;
}

const ReorderItem = ({ item }: { item: Item }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={controls}
      className="relative flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow select-none"
    >
      <div
        className="cursor-move touch-none p-1 text-muted-foreground hover:text-foreground"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1">{item.content}</div>
    </Reorder.Item>
  );
};

export function ReorderList({ items, onReorder, className }: ReorderListProps) {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn("flex flex-col gap-2", className)}
    >
      {items.map((item) => (
        <ReorderItem key={item.id} item={item} />
      ))}
    </Reorder.Group>
  );
}

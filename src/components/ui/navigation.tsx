"use client";

import { useId, useState, type ReactNode } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import { distance } from "@/lib/motion/tokens";
import { Button } from "./actions";

export function Tabs({
  label,
  items,
}: {
  label: string;
  items: {
    value: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
  }[];
}) {
  return (
    <TabsPrimitive.Root defaultValue={items[0]?.value} className="ui-tabs">
      <TabsPrimitive.List aria-label={label} className="ui-tab-list">
        {items.map((item) => (
          <TabsPrimitive.Trigger
            className="ui-tab"
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          className="ui-tab-panel"
          key={item.value}
          value={item.value}
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const { reduced, transition } = useMotionPolicy();
  return (
    <div className="ui-accordion">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {title}
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={open ? "is-open" : ""}
          />
        </button>
      </h3>
      <div id={id} hidden={!open}>
        {open && (
          <motion.div
            className="ui-accordion-body"
            initial={{
              opacity: reduced ? 1 : 0,
              y: reduced ? 0 : distance.small,
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
export function Pagination({
  page,
  pages,
  onPageChange,
}: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className="ui-pagination" aria-label="Halaman tabel">
      <Button
        variant="secondary"
        aria-label="Halaman sebelumnya"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={20} />
        Sebelumnya
      </Button>
      <span aria-live="polite">
        Halaman <strong className="numeric">{page}</strong> dari {pages}
      </span>
      <Button
        variant="secondary"
        aria-label="Halaman berikutnya"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Berikutnya
        <ChevronRight size={20} />
      </Button>
    </nav>
  );
}

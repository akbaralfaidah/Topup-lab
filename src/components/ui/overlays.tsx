"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import { distance, duration, easing } from "@/lib/motion/tokens";
import { IconButton } from "./actions";

type DialogProps = {
  trigger: ReactElement;
  title: string;
  description: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
function Overlay({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  kind,
}: DialogProps & { kind: "dialog" | "drawer" | "sheet" }) {
  const { reduced } = useMotionPolicy();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-scrim" />
        <DialogPrimitive.Content asChild>
          <motion.div
            className={`ui-overlay ui-${kind}`}
            initial={{
              opacity: reduced ? 1 : 0,
              y: reduced ? 0 : distance.normal,
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduced ? 0 : duration.emphasized,
              ease: easing.enter,
            }}
          >
            <div className="ui-overlay-header">
              <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <IconButton label="Tutup">
                  <X size={20} />
                </IconButton>
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="ui-overlay-description">
              {description}
            </DialogPrimitive.Description>
            <div className="ui-overlay-body">{children}</div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
export function Dialog(props: DialogProps) {
  return <Overlay {...props} kind="dialog" />;
}
export function Drawer(props: DialogProps) {
  return <Overlay {...props} kind="drawer" />;
}
export function BottomSheet(props: DialogProps) {
  return <Overlay {...props} kind="sheet" />;
}
export const DialogClose = DialogPrimitive.Close;

export function Popover({
  trigger,
  children,
  label,
}: {
  trigger: ReactElement;
  children: ReactNode;
  label: string;
}) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="ui-popover"
          sideOffset={8}
          collisionPadding={20}
          aria-label={label}
        >
          <div className="ui-popup-header">
            <strong>{label}</strong>
            <PopoverPrimitive.Close asChild>
              <IconButton label="Tutup informasi">
                <X size={16} />
              </IconButton>
            </PopoverPrimitive.Close>
          </div>
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
export function Tooltip({
  children,
  content,
}: {
  children: ReactElement;
  content: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipPrimitive.Provider delayDuration={duration.fast * 1000}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild onClick={() => setOpen(!open)}>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="ui-tooltip"
            sideOffset={8}
            collisionPadding={20}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
export function Dropdown({
  trigger,
  items,
  label,
}: {
  trigger: ReactElement;
  label: string;
  items: { label: string; onSelect: () => void; disabled?: boolean }[];
}) {
  return (
    <MenuPrimitive.Root modal={false}>
      <MenuPrimitive.Trigger asChild>{trigger}</MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Content
          aria-label={label}
          className="ui-menu"
          sideOffset={8}
          collisionPadding={20}
        >
          {items.map((item) => (
            <MenuPrimitive.Item
              key={item.label}
              className="ui-menu-item"
              onSelect={item.onSelect}
              disabled={item.disabled}
            >
              {item.label}
            </MenuPrimitive.Item>
          ))}
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

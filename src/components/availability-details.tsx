"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useMotionPolicy } from "@/lib/motion/use-motion-policy";
import { distance } from "@/lib/motion/tokens";

export function AvailabilityDetails() {
  const [open, setOpen] = useState(false);
  const { reduced, transition } = useMotionPolicy();
  return (
    <div className="availability-details">
      <button
        className="disclosure-button"
        type="button"
        aria-expanded={open}
        aria-controls="availability-answer"
        onClick={() => setOpen(!open)}
      >
        Apakah sudah bisa bertransaksi?
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div id="availability-answer" hidden={!open}>
        {open && (
          <motion.p
            initial={{
              opacity: reduced ? 1 : 0,
              y: reduced ? 0 : distance.small,
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
          >
            Belum. Pembelian, pembayaran, dan pendaftaran akun belum dibuka.
            Kami akan menampilkan produk saat layanan siap digunakan.
          </motion.p>
        )}
      </div>
    </div>
  );
}

"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback } from "react";
import { backdropFade, sheetSlideUp, springs } from "@/lib/motion-variants";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Dismiss if dragged far enough or fast enough downward
      if (info.offset.y > 200 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...backdropFade}
          className="fixed inset-0 z-50 flex items-end bg-foreground/30"
          onClick={onClose}
        >
          <motion.div
            {...sheetSlideUp}
            transition={springs.sheet}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="w-full rounded-t-2xl bg-white shadow-xl touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-foreground/20" />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

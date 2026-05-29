"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const NOTIFICATION = {
  title: "BoZ held rates at 13.5%",
  body: "Tap to see what this means for your shares.",
  route: "/news",
};

const DELAY_MS = 25_000;
const SESSION_KEY = "ml-notification-shown";

export function SessionNotification() {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (pathname !== "/") return;
    if (hasStartedRef.current) return;
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    hasStartedRef.current = true;
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  function handleTap() {
    dismiss();
    router.push(NOTIFICATION.route);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-80 bg-brand-ink text-brand-cream rounded-2xl shadow-2xl overflow-hidden"
        >
          <button
            onClick={handleTap}
            className="w-full px-5 py-4 text-left flex items-start gap-3"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold">{NOTIFICATION.title}</p>
              <p className="text-sm text-brand-cream/70 mt-0.5">{NOTIFICATION.body}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="shrink-0 text-brand-cream/40 hover:text-brand-cream mt-0.5"
            >
              <X size={16} />
            </button>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

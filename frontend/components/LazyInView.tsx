"use client";

import { useEffect, useRef, useState } from "react";

export default function LazyInView({
  children,
  rootMargin = "200px",
  once = true,
  className = "",
}: {
  children: React.ReactNode;
  rootMargin?: string;
  once?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, once]);

  return <div ref={ref} className={className}>{visible ? children : null}</div>;
}



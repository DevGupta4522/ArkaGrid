"use client";

import { useEffect, useState } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that ensures content only renders on client
 * Prevents hydration mismatches for dynamic content
 */
export function ClientOnly({ children }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}

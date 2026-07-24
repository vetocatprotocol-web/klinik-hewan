"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  const matchesRef = useRef(matches);

  const updateMatches = useCallback(() => {
    const result = window.matchMedia(query).matches;
    if (matchesRef.current !== result) {
      matchesRef.current = result;
      setMatches(result);
    }
  }, [query]);

  useEffect(() => {
    updateMatches();

    const media = window.matchMedia(query);
    const listener = () => updateMatches();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query, updateMatches]);

  return matches;
}

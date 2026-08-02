import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { COMPARE_MAX, COMPARE_MIN } from "./useHackathonWatchlist";

const NOT_IN_LIST_MSG = "部分黑客松不在意向清单中";

function parseCompareIds(raw) {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  const seen = new Set();
  const ids = [];
  raw.split(",").forEach((part) => {
    const id = part.trim();
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  });
  return ids;
}

export default function useWatchlistUrlSync(watchlist) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [urlToast, setUrlToast] = useState(null);
  const lastWarnedRef = useRef(null);
  const cleanedRef = useRef(null);
  const toastTimerRef = useRef(null);

  const watchParam = searchParams.get("watch");
  const compareParam = searchParams.get("compare");
  const watchOpen = watchParam === "1";

  const compareIds = useMemo(
    () => parseCompareIds(compareParam),
    [compareParam],
  );

  const showUrlToast = useCallback((message, tone = "info") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setUrlToast({ message, tone, id: Date.now() });
    toastTimerRef.current = setTimeout(() => setUrlToast(null), 2600);
  }, []);

  const dismissUrlToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setUrlToast(null);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const updateParams = useCallback(
    (next) => {
      const cleaned = new URLSearchParams(searchParams);
      cleaned.delete("watch");
      cleaned.delete("compare");
      if (next.watch === 1) cleaned.set("watch", "1");
      if (next.compare && next.compare.length > 0) {
        cleaned.set("compare", next.compare.join(","));
      }
      if (Array.from(cleaned).length === 0) {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams(cleaned, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  const openPanel = useCallback(() => {
    updateParams({ watch: 1 });
  }, [updateParams]);

  const closePanel = useCallback(() => {
    updateParams({});
  }, [updateParams]);

  const closeCompare = useCallback(() => {
    updateParams({ watch: 1 });
  }, [updateParams]);

  const startCompare = useCallback(
    (orderedIds) => {
      if (!Array.isArray(orderedIds) || orderedIds.length < COMPARE_MIN) {
        return;
      }
      const valid = orderedIds.filter((id) => watchlist.has(id));
      if (valid.length < COMPARE_MIN) {
        showUrlToast(NOT_IN_LIST_MSG, "error");
        return;
      }
      const clipped = valid.slice(0, COMPARE_MAX);
      updateParams({ watch: 1, compare: clipped });
    },
    [watchlist, updateParams, showUrlToast],
  );

  const validatedCompareItems = useMemo(() => {
    if (!watchOpen) return { items: [], invalid: false };
    const byId = new Map(watchlist.items.map((it) => [it.id, it]));
    const ordered = [];
    let invalid = false;
    compareIds.forEach((id) => {
      const item = byId.get(id);
      if (item) ordered.push(item);
      else invalid = true;
    });
    return { items: ordered, invalid };
  }, [watchOpen, compareIds, watchlist.items]);

  useEffect(() => {
    if (!watchOpen) {
      lastWarnedRef.current = null;
      cleanedRef.current = null;
      return;
    }

    if (compareIds.length === 0) return;

    const signature = compareIds.join("|");
    const validIds = compareIds.filter((id) => watchlist.has(id));

    if (validatedCompareItems.invalid) {
      if (lastWarnedRef.current !== signature) {
        lastWarnedRef.current = signature;
        showUrlToast(NOT_IN_LIST_MSG, "error");
      }
      if (cleanedRef.current !== signature) {
        cleanedRef.current = signature;
        if (validIds.length >= COMPARE_MIN) {
          updateParams({
            watch: 1,
            compare: validIds.slice(0, COMPARE_MAX),
          });
        } else {
          updateParams({ watch: 1 });
        }
      }
      return;
    }

    if (compareIds.length > COMPARE_MAX) {
      if (cleanedRef.current !== signature) {
        cleanedRef.current = signature;
        updateParams({
          watch: 1,
          compare: compareIds.slice(0, COMPARE_MAX),
        });
      }
      return;
    }

    if (compareIds.length < COMPARE_MIN) {
      if (cleanedRef.current !== signature) {
        cleanedRef.current = signature;
        updateParams({ watch: 1 });
      }
    }
  }, [
    watchOpen,
    compareIds,
    validatedCompareItems.invalid,
    watchlist,
    updateParams,
    showUrlToast,
  ]);

  const compareOpen =
    watchOpen &&
    !validatedCompareItems.invalid &&
    compareIds.length >= COMPARE_MIN &&
    compareIds.length <= COMPARE_MAX &&
    validatedCompareItems.items.length === compareIds.length;

  return {
    panelOpen: watchOpen,
    compareOpen,
    compareItems: compareOpen ? validatedCompareItems.items : [],
    compareIdSet: useMemo(
      () => new Set(compareOpen ? compareIds : []),
      [compareOpen, compareIds],
    ),
    openPanel,
    closePanel,
    closeCompare,
    startCompare,
    urlToast,
    dismissUrlToast,
  };
}

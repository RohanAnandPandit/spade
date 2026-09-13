import { useEffect, useState } from "react";

import { apiErrorMessage, isCancelledRequest } from "../api/client";
import { getQueryAnalysis } from "../api/queries";
import { QueryAnalysis, RepositoryId } from "../types";

export function useQueryAnalysis(
  query: string,
  repository: RepositoryId | null,
  delay = 350
) {
  const [analysis, setAnalysis] = useState<QueryAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repository || !query.trim()) {
      setAnalysis(null);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getQueryAnalysis(
          query,
          repository,
          controller.signal
        );
        if (active) setAnalysis(result);
      } catch (requestError) {
        if (active && !isCancelledRequest(requestError)) {
          setAnalysis(null);
          setError(
            apiErrorMessage(requestError, "Could not analyse the query.")
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }, delay);

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [delay, query, repository]);

  return { analysis, loading, error };
}

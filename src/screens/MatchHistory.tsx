import { createSignal, createEffect, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { getGroupMatches, type Match } from "../services/matches";

export function MatchHistory() {
  const params = useParams<{ groupId: string }>();
  const [matches, setMatches] = createSignal<Match[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [page, setPage] = createSignal(0);
  const pageSize = 20;

  // Fetch matches when groupId changes
  createEffect(() => {
    const groupId = params.groupId;
    setLoading(true);
    setError(null);

    getGroupMatches(groupId)
      .then((allMatches) => {
        // Filter to confirmed matches only, sorted by confirmedAt descending
        const confirmed = allMatches
          .filter(m => m.status === "confirmed")
          .sort((a, b) => {
            const dateA = a.confirmedAt || new Date(0);
            const dateB = b.confirmedAt || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
        setMatches(confirmed);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load matches");
      })
      .finally(() => {
        setLoading(false);
      });
  });

  const paginatedMatches = () => {
    const start = page() * pageSize;
    return matches().slice(start, start + pageSize);
  };

  const hasMore = () => (page() + 1) * pageSize < matches().length;

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return date.toLocaleDateString();
  };

  return (
    <div class="match-history">
      <header class="match-history__header">
        <h1>Match History</h1>
      </header>

      <Show when={loading()}>
        <div class="match-history__loading">Loading...</div>
      </Show>

      <Show when={error()}>
        <div class="match-history__error">{error()}</div>
      </Show>

      <Show when={!loading() && !error()}>
        <Show when={matches().length === 0}>
          <div class="match-history__empty">No matches yet</div>
        </Show>

        <Show when={matches().length > 0}>
          <ul class="match-history__list">
            <For each={paginatedMatches()}>
              {(match) => (
                <li class="match-history__item">
                  <span class="match-history__players">
                    {match.player1Id} vs {match.player2Id}
                  </span>
                  <span class="match-history__winner">
                    Winner: {match.winnerId}
                  </span>
                  <Show when={match.scores && match.scores.length > 0}>
                    <span class="match-history__score">
                      {match.scores?.join(", ")}
                    </span>
                  </Show>
                  <span class="match-history__date">
                    {formatDate(match.confirmedAt)}
                  </span>
                </li>
              )}
            </For>
          </ul>

          <div class="match-history__pagination">
            <button
              type="button"
              class="match-history__btn"
              disabled={page() === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span class="match-history__page-info">
              Page {page() + 1}
            </span>
            <button
              type="button"
              class="match-history__btn"
              disabled={!hasMore()}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </Show>
      </Show>
    </div>
  );
}

export default MatchHistory;

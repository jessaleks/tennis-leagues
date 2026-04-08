import { createSignal, onMount, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { getGroupMatches, type Match } from "../services/matches";
import { authStore } from "../stores/auth.store";

interface RecentMatchesProps {
  groupId: string;
  limit?: number;
}

export function RecentMatches(props: RecentMatchesProps) {
  const navigate = useNavigate();
  const [matches, setMatches] = createSignal<Match[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  const limit = props.limit ?? 10;

  onMount(async () => {
    try {
      const allMatches = await getGroupMatches(props.groupId);
      // Filter to confirmed matches only, sorted by confirmedAt descending
      const confirmed = allMatches
        .filter(m => m.status === "confirmed")
        .sort((a, b) => {
          const dateA = a.confirmedAt || new Date(0);
          const dateB = b.confirmedAt || new Date(0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);
      setMatches(confirmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  });

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getPlayerName = (playerId: string) => {
    // For now, show truncated ID - in production, would resolve from user profiles
    return playerId.slice(0, 8);
  };

  const isWinner = (match: Match, playerId: string) => {
    return match.winnerId === playerId;
  };

  const currentUserId = () => authStore.currentUser()?.uid;

  return (
    <div class="recent-matches">
      <Show when={loading()}>
        <div class="recent-matches__loading">Loading matches...</div>
      </Show>

      <Show when={error()}>
        <div class="recent-matches__error">{error()}</div>
      </Show>

      <Show when={!loading() && !error()}>
        <Show when={matches().length === 0}>
          <div class="recent-matches__empty">No matches yet</div>
        </Show>

        <Show when={matches().length > 0}>
          <ul class="recent-matches__list">
            <For each={matches()}>
              {(match) => {
                const player1Name = getPlayerName(match.player1Id);
                const player2Name = getPlayerName(match.player2Id);
                const isCurrentUserWinner = match.winnerId === currentUserId();
                const isCurrentUserPlayer = match.player1Id === currentUserId() || match.player2Id === currentUserId();

                return (
                  <li class="recent-matches__item">
                    <div class="recent-matches__players">
                      <span class={`recent-matches__name ${isWinner(match, match.player1Id) ? "recent-matches__name--winner" : ""}`}>
                        {player1Name}
                      </span>
                      <span class="recent-matches__vs">vs</span>
                      <span class={`recent-matches__name ${isWinner(match, match.player2Id) ? "recent-matches__name--winner" : ""}`}>
                        {player2Name}
                      </span>
                    </div>
                    <Show when={match.scores && match.scores.length > 0}>
                      <div class="recent-matches__score">
                        {match.scores?.join(", ")}
                      </div>
                    </Show>
                    <div class="recent-matches__meta">
                      <Show when={isCurrentUserPlayer}>
                        <span class={`recent-matches__result ${isCurrentUserWinner ? "recent-matches__result--win" : "recent-matches__result--loss"}`}>
                          {isCurrentUserWinner ? "Won" : "Lost"}
                        </span>
                      </Show>
                      <span class="recent-matches__date">
                        {formatDate(match.confirmedAt)}
                      </span>
                    </div>
                  </li>
                );
              }}
            </For>
          </ul>

          <div class="recent-matches__footer">
            <button
              type="button"
              class="recent-matches__view-all"
              onClick={() => navigate(`/group/${props.groupId}/matches`)}
            >
              View All Matches
            </button>
          </div>
        </Show>
      </Show>
    </div>
  );
}

export default RecentMatches;

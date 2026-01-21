import { useEffect, useState } from 'react';
import { getLeaderboard, GameScore } from '../lib/insforge';
import { ELEMENTS } from '../game/elements';

interface LeaderboardProps {
  onClose: () => void;
  refreshTrigger?: number; // Increment to refresh leaderboard
  currentGame?: { score: number; highestElement: number }; // Current game's score
}

interface DisplayScore extends GameScore {
  isCurrentGame?: boolean;
  isEllipsis?: boolean;
}

export default function Leaderboard({ onClose, refreshTrigger, currentGame }: LeaderboardProps) {
  const [scores, setScores] = useState<DisplayScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getLeaderboard(50);

      if (fetchError) {
        setError('Failed to load leaderboard');
        console.error('Leaderboard error:', fetchError);
      } else {
        const processedScores = processScores(data || [], currentGame);
        setScores(processedScores);
      }

      setLoading(false);
    }

    fetchLeaderboard();
  }, [refreshTrigger, currentGame]);

  // Process scores to show top 10, current game, and nearby scores
  function processScores(allScores: GameScore[], current: { score: number; highestElement: number } | undefined): DisplayScore[] {
    if (!allScores.length) return [];

    // If no current game, just show top 10
    if (!current) {
      return allScores.slice(0, 10).map(s => ({ ...s }));
    }

    const result: DisplayScore[] = [];
    const top10 = allScores.slice(0, 10);
    let currentGameAdded = false;

    // Find where current game would rank (by highest element, then score)
    let insertIndex = top10.length;
    for (let i = 0; i < top10.length; i++) {
      if (current.highestElement > top10[i].highest_element ||
          (current.highestElement === top10[i].highest_element && current.score > top10[i].score)) {
        insertIndex = i;
        break;
      }
    }

    // Build the display list
    for (let i = 0; i < top10.length; i++) {
      // Add ellipsis if we're about to insert current game and there's a gap
      if (i === insertIndex && !currentGameAdded) {
        result.push({
          id: 'current',
          user_id: '',
          score: current.score,
          highest_element: current.highestElement,
          lines_cleared: 0,
          victory: false,
          played_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          isCurrentGame: true
        });
        currentGameAdded = true;
      }

      result.push({ ...top10[i] });
    }

    // Add current game at the end if not yet added (would be below top 10)
    if (!currentGameAdded) {
      // Check if current game is close to #10 (within 5 highest elements or 10000 score)
      const score10 = top10[top10.length - 1];
      if (score10) {
        const elementDiff = score10.highest_element - current.highestElement;
        if (elementDiff <= 5 || (score10.score - current.score < 10000)) {
          // Add ellipsis if there's a gap
          if (!result.some(s => s.isEllipsis)) {
            result.push({
              id: 'ellipsis',
              user_id: '',
              score: 0,
              highest_element: 0,
              lines_cleared: 0,
              victory: false,
              played_at: '',
              created_at: '',
              isEllipsis: true
            });
          }
          result.push({
            id: 'current',
            user_id: '',
            score: current.score,
            highest_element: current.highestElement,
            lines_cleared: 0,
            victory: false,
            played_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            isCurrentGame: true
          });
        }
      }
    }

    return result;
  }

  const getDisplayName = (score: DisplayScore): string => {
    if (score.isCurrentGame) return 'You (Current)';
    if (score.users?.nickname) return score.users.nickname;
    return 'Anonymous';
  };

  const getElementSymbol = (atomicNumber: number): string => {
    return ELEMENTS[atomicNumber]?.symbol || '?';
  };

  const getElementColor = (atomicNumber: number): string => {
    return ELEMENTS[atomicNumber]?.color || '#888';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate rank for display
  let displayRank = 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[200]">
      <div className="bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a] border-2 border-[#4a4aff] rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ffd700] to-[#ff9800] bg-clip-text text-transparent">
            Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">{error}</div>
          ) : scores.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No scores yet. Be the first to play!
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase tracking-wider px-3 py-2">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Player</div>
                <div className="col-span-3 text-right">Score</div>
                <div className="col-span-2 text-center">Element</div>
                <div className="col-span-2 text-right">Date</div>
              </div>

              {/* Score Rows */}
              {scores.map((score, index) => {
                if (score.isEllipsis) {
                  return (
                    <div key="ellipsis" className="px-3 py-2 text-center text-gray-500">
                      ...
                    </div>
                  );
                }

                displayRank++;

                return (
                  <div
                    key={score.id}
                    className={`grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-lg ${
                      score.isCurrentGame
                        ? 'bg-gradient-to-r from-[#00f0f0]/20 to-transparent border border-[#00f0f0]/50'
                        : index === 0 && !score.isCurrentGame
                        ? 'bg-gradient-to-r from-[#ffd700]/20 to-transparent border border-[#ffd700]/30'
                        : index === 1 && !score.isCurrentGame
                        ? 'bg-gradient-to-r from-[#c0c0c0]/20 to-transparent border border-[#c0c0c0]/30'
                        : index === 2 && !score.isCurrentGame
                        ? 'bg-gradient-to-r from-[#cd7f32]/20 to-transparent border border-[#cd7f32]/30'
                        : 'bg-white/5'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`col-span-1 font-bold ${
                      score.isCurrentGame
                        ? 'text-[#00f0f0]'
                        : index === 0
                        ? 'text-[#ffd700]'
                        : index === 1
                        ? 'text-[#c0c0c0]'
                        : index === 2
                        ? 'text-[#cd7f32]'
                        : 'text-gray-400'
                    }`}>
                      {score.isCurrentGame ? '-' : displayRank}
                    </div>

                    {/* Player Name */}
                    <div className="col-span-4 flex items-center gap-2">
                      <span className={`truncate ${score.isCurrentGame ? 'text-[#00f0f0]' : 'text-white'}`}>
                        {getDisplayName(score)}
                      </span>
                      {score.victory && !score.isCurrentGame && (
                        <span className="text-[#76ff03] text-xs" title="Victory!">W</span>
                      )}
                    </div>

                    {/* Score */}
                    <div className="col-span-3 text-right font-mono text-[#ffd700]">
                      {score.score.toLocaleString()}
                    </div>

                    {/* Highest Element */}
                    <div className="col-span-2 flex justify-center">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          backgroundColor: getElementColor(score.highest_element) + '33',
                          color: getElementColor(score.highest_element),
                          border: `1px solid ${getElementColor(score.highest_element)}66`
                        }}
                        title={ELEMENTS[score.highest_element]?.name || 'Unknown'}
                      >
                        {getElementSymbol(score.highest_element)}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 text-right text-xs text-gray-500">
                      {score.isCurrentGame ? 'Now' : formatDate(score.played_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-[#4a4aff] to-[#3a3adf] rounded-lg hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getLeaderboard, GameScore } from '../lib/insforge';
import { ELEMENTS } from '../game/elements';

interface LeaderboardProps {
  onClose: () => void;
  refreshTrigger?: number; // Increment to refresh leaderboard
}

export default function Leaderboard({ onClose, refreshTrigger }: LeaderboardProps) {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getLeaderboard(20);

      if (fetchError) {
        setError('Failed to load leaderboard');
        console.error('Leaderboard error:', fetchError);
      } else {
        setScores(data || []);
      }

      setLoading(false);
    }

    fetchLeaderboard();
  }, [refreshTrigger]);

  const getDisplayName = (score: GameScore): string => {
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
              {scores.map((score, index) => (
                <div
                  key={score.id}
                  className={`grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-lg ${
                    index === 0
                      ? 'bg-gradient-to-r from-[#ffd700]/20 to-transparent border border-[#ffd700]/30'
                      : index === 1
                      ? 'bg-gradient-to-r from-[#c0c0c0]/20 to-transparent border border-[#c0c0c0]/30'
                      : index === 2
                      ? 'bg-gradient-to-r from-[#cd7f32]/20 to-transparent border border-[#cd7f32]/30'
                      : 'bg-white/5'
                  }`}
                >
                  {/* Rank */}
                  <div className={`col-span-1 font-bold ${
                    index === 0 ? 'text-[#ffd700]' :
                    index === 1 ? 'text-[#c0c0c0]' :
                    index === 2 ? 'text-[#cd7f32]' :
                    'text-gray-400'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Player Name */}
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="text-white truncate">{getDisplayName(score)}</span>
                    {score.victory && (
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
                    {formatDate(score.played_at)}
                  </div>
                </div>
              ))}
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

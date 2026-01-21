import { useState } from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser, useAuth } from '@insforge/react';
import IsotopicTetris from './components/IsotopicTetris';
import Leaderboard from './components/Leaderboard';

function App() {
  const { user } = useUser();
  const { isLoaded } = useAuth();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardRefreshTrigger, setLeaderboardRefreshTrigger] = useState(0);
  const [currentGame, setCurrentGame] = useState<{ score: number; highestElement: number } | undefined>(undefined);

  const handleGameOver = (score: number, highestElement: number, _victory: boolean) => {
    setCurrentGame({ score, highestElement });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex justify-center items-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex flex-col items-center font-sans text-white">
      {/* Header */}
      <header className="w-full p-4 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00f0f0] to-[#76ff03] bg-clip-text text-transparent">
          Isotopic Tetris
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#ffd700] to-[#ff9800] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Leaderboard
          </button>
          <SignedIn>
            <span className="text-sm text-gray-300">
              Welcome, {user?.name || user?.email}
            </span>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton className="px-4 py-2 bg-gradient-to-r from-[#4a4aff] to-[#3a3adf] rounded-lg hover:opacity-90 transition-opacity" />
            <SignUpButton className="px-4 py-2 border border-[#4a4aff] rounded-lg hover:bg-[#4a4aff]/20 transition-colors" />
          </SignedOut>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center gap-8 px-4 py-6">
        {/* Game Rules - Left Side */}
        <div className="w-80 bg-black/40 border border-[#4a4a6a] rounded-xl p-6 text-sm sticky top-6">
          <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-[#00f0f0] to-[#76ff03] bg-clip-text text-transparent">
            How to Play
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-[#ffd700] font-semibold mb-1">Objective</h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                Synthesize Uranium (U-92) by fusing elements together! Start with Hydrogen and work your way up the periodic table.
              </p>
            </div>

            <div>
              <h3 className="text-[#00f0f0] font-semibold mb-1">Fusion Rules</h3>
              <ul className="text-gray-300 text-xs leading-relaxed space-y-1">
                <li><span className="text-[#76ff03]">Standard:</span> X + X = 2X (e.g., H + H = He)</li>
                <li><span className="text-[#76ff03]">Alpha:</span> X + He = X+2 (e.g., C + He = O)</li>
                <li><span className="text-[#76ff03]">Beta:</span> X + H = X+1 (e.g., C + H = N)</li>
                <li><span className="text-[#76ff03]">Triple-Alpha:</span> 3 He = C (when adjacent)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[#ff9800] font-semibold mb-1">Game Stages</h3>
              <ul className="text-gray-300 text-xs leading-relaxed space-y-1">
                <li><span className="text-white">Stage 1:</span> Hydrogen Age (H, He)</li>
                <li><span className="text-white">Stage 2:</span> Stellar Age (+ C, N, O)</li>
                <li><span className="text-white">Stage 3:</span> Supernova (+ Ne, Si, Fe)</li>
                <li><span className="text-white">Stage 4:</span> Radioactive Era</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[#ff1744] font-semibold mb-1">Special Mechanics</h3>
              <ul className="text-gray-300 text-xs leading-relaxed space-y-1">
                <li><span className="text-[#ff1744]">Radioactive Decay:</span> Unstable elements have half-life timers. Clear lines to stabilize them!</li>
                <li><span className="text-[#ffc107]">Line Clear Bonus:</span> Clearing lines boosts elements in the row above (+2 per line cleared).</li>
                <li><span className="text-[#b388ff]">Overflow:</span> Fusing beyond Uranium creates waste blocks.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-[#4a4aff] font-semibold mb-1">Controls</h3>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-300">
                <span>Move</span><span className="text-right font-mono">← →</span>
                <span>Soft Drop</span><span className="text-right font-mono">↓</span>
                <span>Hard Drop</span><span className="text-right font-mono">Space</span>
                <span>Rotate CW</span><span className="text-right font-mono">↑ / X</span>
                <span>Rotate CCW</span><span className="text-right font-mono">Z</span>
                <span>Hold</span><span className="text-right font-mono">C</span>
                <span>Pause</span><span className="text-right font-mono">P</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-[#76ff03] text-xs font-semibold text-center">
                Reach Uranium (U-92) to WIN!
              </p>
            </div>
          </div>
        </div>

        {/* Game Content - Right Side */}
        <div className="flex flex-col items-center">
          <SignedOut>
            <div className="text-center p-8 max-w-md">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#00f0f0] via-[#ffd700] to-[#76ff03] bg-clip-text text-transparent">
                Isotopic Tetris
              </h2>
              <p className="text-gray-400 mb-8">
                Fuse elements from Hydrogen to Uranium! Sign in to play and save your high scores.
              </p>
              <div className="flex flex-col gap-4 items-center">
                <SignInButton className="w-full max-w-xs px-6 py-3 bg-gradient-to-r from-[#4a4aff] to-[#3a3adf] rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity" />
                <span className="text-gray-500">or</span>
                <SignUpButton className="w-full max-w-xs px-6 py-3 border-2 border-[#4a4aff] rounded-lg text-lg font-semibold hover:bg-[#4a4aff]/20 transition-colors" />
              </div>

              {/* Game Preview */}
              <div className="mt-12 grid grid-cols-4 gap-2 justify-center opacity-30">
                {['I', 'O', 'T', 'S', 'Z', 'J', 'L', 'I'].map((type, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded"
                    style={{
                      backgroundColor: {
                        I: '#00f0f0',
                        O: '#f0f000',
                        T: '#a000f0',
                        S: '#00f000',
                        Z: '#f00000',
                        J: '#0000f0',
                        L: '#f0a000'
                      }[type]
                    }}
                  />
                ))}
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            <IsotopicTetris
              userId={user?.id}
              onGameOver={handleGameOver}
              onScoreSaved={() => setLeaderboardRefreshTrigger(prev => prev + 1)}
            />
          </SignedIn>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-4 text-center text-gray-500 text-sm">
        <SignedIn>
          <p>Press P to pause | Arrow keys to move | Space for hard drop</p>
        </SignedIn>
      </footer>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard
          onClose={() => setShowLeaderboard(false)}
          refreshTrigger={leaderboardRefreshTrigger}
          currentGame={currentGame}
        />
      )}
    </div>
  );
}

export default App;

import { useState } from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser, useAuth } from '@insforge/react';
import IsotopicTetris from './components/IsotopicTetris';
import Leaderboard from './components/Leaderboard';

function App() {
  const { user } = useUser();
  const { isLoaded } = useAuth();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardRefreshTrigger, setLeaderboardRefreshTrigger] = useState(0);

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
      <main className="flex-1 flex flex-col items-center justify-center">
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
            onScoreSaved={() => setLeaderboardRefreshTrigger(prev => prev + 1)}
          />
        </SignedIn>
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
        />
      )}
    </div>
  );
}

export default App;

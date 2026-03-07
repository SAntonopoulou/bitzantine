import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-900 text-amber-50">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center bg-stone-800 bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-6xl font-bold text-amber-500 mb-4 drop-shadow-lg">The Bitzantine Empire</h1>
          <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
            Join the most prestigious civilization in Bitcraft. Build, trade, and conquer with honor.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/join" className="bg-amber-600 text-white px-8 py-3 rounded font-bold hover:bg-amber-700 transition-colors">
              Join the Empire
            </Link>
            <Link to="/lore" className="border-2 border-amber-600 text-amber-500 hover:bg-amber-900/30 font-bold py-3 px-8 rounded transition-colors">
              Read Our History
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-stone-800 p-6 rounded-lg border border-stone-700 text-center hover:border-amber-500 transition-colors">
            <div className="text-amber-500 text-4xl mb-4">🏛️</div>
            <h3 className="text-xl font-bold mb-2 text-stone-200">Structured Government</h3>
            <p className="text-stone-400">A clear hierarchy ensuring order and prosperity for all citizens.</p>
          </div>
          <div className="bg-stone-800 p-6 rounded-lg border border-stone-700 text-center hover:border-amber-500 transition-colors">
            <div className="text-amber-500 text-4xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold mb-2 text-stone-200">Military Might</h3>
            <p className="text-stone-400">Defending our borders and expanding our influence across the realm.</p>
          </div>
          <div className="bg-stone-800 p-6 rounded-lg border border-stone-700 text-center hover:border-amber-500 transition-colors">
            <div className="text-amber-500 text-4xl mb-4">📜</div>
            <h3 className="text-xl font-bold mb-2 text-stone-200">Rich Lore</h3>
            <p className="text-stone-400">Be part of a living history written by the actions of our players.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

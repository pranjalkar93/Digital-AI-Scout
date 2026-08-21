import React, { useState } from 'react';
import { PlayerProfile, CommunityPost } from '../types';
import { Search, Filter, ShieldCheck, MapPin, Zap, User, Video, Trophy, Sparkles } from 'lucide-react';

interface DiscoverViewProps {
  players: PlayerProfile[];
  posts: CommunityPost[];
  onSelectPlayer: (player: PlayerProfile) => void;
  onRequireAuth: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  players,
  posts,
  onSelectPlayer,
  onRequireAuth
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [activeSubTab, setActiveSubTab] = useState<'PLAYERS' | 'VIDEOS'>('PLAYERS');

  const states = ['All', 'Kerala', 'Punjab', 'West Bengal', 'Maharashtra', 'Manipur', 'Karnataka'];
  const positions = ['All', 'Winger', 'Striker', 'Central Mid', 'Center Back', 'Goalkeeper'];

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          player.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          player.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === 'All' || player.state === selectedState;
    const matchesPosition = selectedPosition === 'All' || player.position === selectedPosition;
    const matchesTier = selectedTier === 'All' || player.tier === selectedTier;

    return matchesSearch && matchesState && matchesPosition && matchesTier;
  });

  const filteredPosts = posts.filter(post => {
    return post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           post.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           post.authorState.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-black text-white">Grassroots Talent Discovery Engine</h2>
            </div>
            <p className="text-xs text-slate-400">
              Search verified football players, drill performance highlights, and local prospects across India.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('PLAYERS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'PLAYERS' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Players ({filteredPlayers.length})
            </button>
            <button
              onClick={() => setActiveSubTab('VIDEOS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'VIDEOS' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Clips ({filteredPosts.length})
            </button>
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by player name, state (Kerala, Punjab...), position, or club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-xs"
          >
            {states.map(st => (
              <option key={st} value={st}>{st === 'All' ? 'All States (India)' : st}</option>
            ))}
          </select>

          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-xs"
          >
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos === 'All' ? 'All Positions' : pos}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Grid Results */}
      {activeSubTab === 'PLAYERS' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map(player => (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer space-y-3 group"
            >
              <div className="flex items-start gap-3">
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-700 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate">{player.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {player.tier}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{player.state}</span> • <span className="text-emerald-400 font-bold">{player.position}</span>
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                      Overall Score: {player.overallScore}
                    </span>
                    {player.verificationStatus.aiffCrsId && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Metrics Pills */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                <div className="p-1.5 bg-slate-950 rounded-lg">
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Speed</p>
                  <p className="text-xs font-black text-amber-300">
                    {player.speedScore ? `${(player.speedScore / 12).toFixed(1)} m/s` : '7.8 m/s'}
                  </p>
                </div>

                <div className="p-1.5 bg-slate-950 rounded-lg">
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Control</p>
                  <p className="text-xs font-black text-emerald-400">
                    {player.ballControlScore || 86}
                  </p>
                </div>

                <div className="p-1.5 bg-slate-950 rounded-lg">
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Rank</p>
                  <p className="text-xs font-black text-teal-300">
                    #{player.nationalRank || 428}
                  </p>
                </div>
              </div>

              <button className="w-full py-2 rounded-xl bg-slate-950 hover:bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center justify-center gap-1.5 transition-colors">
                <User className="w-3.5 h-3.5" /> View Verified Profile & Clips
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPosts.map(post => (
            <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={post.authorPhoto} alt={post.authorName} className="w-9 h-9 rounded-xl object-cover" />
                <div>
                  <h4 className="text-xs font-bold text-white">{post.authorName}</h4>
                  <p className="text-[10px] text-slate-400">{post.authorState} • {post.timestamp}</p>
                </div>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                <img src={post.videoThumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                    ▶
                  </div>
                </div>
              </div>

              <p className="text-xs font-bold text-white">{post.title}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

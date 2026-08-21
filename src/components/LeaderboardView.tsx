import React, { useState } from 'react';
import { PlayerProfile } from '../types';
import { Trophy, Medal, MapPin, Filter, Search, Award, ShieldCheck, Sparkles } from 'lucide-react';

interface LeaderboardViewProps {
  players: PlayerProfile[];
  onSelectPlayer: (player: PlayerProfile) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ players, onSelectPlayer }) => {
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedAge, setSelectedAge] = useState<string>('All');
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const indianStates = ['All', 'Kerala', 'Punjab', 'West Bengal', 'Mizoram', 'Goa', 'Maharashtra', 'Karnataka', 'Tamil Nadu'];
  const ageGroups = ['All', 'U14', 'U16', 'U18'];
  const positions = ['All', 'Goalkeeper', 'Center Back', 'Full Back', 'Defensive Mid', 'Central Mid', 'Attacking Mid', 'Winger', 'Striker'];
  const tiers = ['All', 'GOLD', 'SILVER', 'BRONZE'];

  const filteredPlayers = players.filter(p => {
    if (selectedState !== 'All' && p.state !== selectedState) return false;
    if (selectedPosition !== 'All' && p.position !== selectedPosition) return false;
    if (selectedTier !== 'All' && p.tier !== selectedTier) return false;
    if (selectedAge === 'U14' && p.age > 14) return false;
    if (selectedAge === 'U16' && (p.age < 15 || p.age > 16)) return false;
    if (selectedAge === 'U18' && (p.age < 17 || p.age > 18)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.currentAcademy.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => b.overallScore - a.overallScore);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white">National & Regional Grassroots Rankings</h2>
          </div>
          <p className="text-xs text-slate-400">
            AI-evaluated performance rankings based on standardized physical and technical drills across 28 Indian States.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Ranked Players</span>
            <span className="text-base font-extrabold text-emerald-400">{players.length}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Gold Tier Talent</span>
            <span className="text-base font-extrabold text-amber-400">
              {players.filter(p => p.tier === 'GOLD').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search player, city or academy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* State Filter */}
        <div>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2.5 px-3 rounded-xl focus:border-emerald-500 focus:outline-none"
          >
            <option value="All">📍 All States</option>
            {indianStates.filter(s => s !== 'All').map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Position Filter */}
        <div>
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2.5 px-3 rounded-xl focus:border-emerald-500 focus:outline-none"
          >
            <option value="All">⚽ All Positions</option>
            {positions.filter(p => p !== 'All').map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Age Group Filter */}
        <div>
          <select
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2.5 px-3 rounded-xl focus:border-emerald-500 focus:outline-none"
          >
            <option value="All">🎂 All Age Groups</option>
            {ageGroups.filter(a => a !== 'All').map(ag => (
              <option key={ag} value={ag}>{ag} Category</option>
            ))}
          </select>
        </div>

        {/* Tier Filter */}
        <div>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2.5 px-3 rounded-xl focus:border-emerald-500 focus:outline-none"
          >
            <option value="All">🏅 All Tiers</option>
            {tiers.filter(t => t !== 'All').map(tr => (
              <option key={tr} value={tr}>{tr} Tier</option>
            ))}
          </select>
        </div>

      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Position</th>
                <th className="py-3.5 px-4 text-center">Tier</th>
                <th className="py-3.5 px-4 text-center">AI Rating</th>
                <th className="py-3.5 px-4 text-center">Verification</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No players found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => onSelectPlayer(player)}
                    >
                      {/* Rank Medal */}
                      <td className="py-4 px-4 text-center font-extrabold text-sm">
                        {rank === 1 ? (
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 mx-auto flex items-center justify-center font-black">
                            🥇 1
                          </div>
                        ) : rank === 2 ? (
                          <div className="w-8 h-8 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 mx-auto flex items-center justify-center font-black">
                            🥈 2
                          </div>
                        ) : rank === 3 ? (
                          <div className="w-8 h-8 rounded-full bg-amber-800/20 text-amber-500 border border-amber-800/40 mx-auto flex items-center justify-center font-black">
                            🥉 3
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">#{rank}</span>
                        )}
                      </td>

                      {/* Player Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {player.name}
                              {player.verificationStatus.aiffCrsId && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" title="AIFF CRS Verified" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              U{player.age} • {player.currentAcademy}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{player.city}, <strong className="text-slate-200">{player.state}</strong></span>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-4 px-4 font-medium text-slate-300">
                        <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px]">
                          {player.position}
                        </span>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                          player.tier === 'GOLD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                          player.tier === 'SILVER' ? 'bg-slate-300/20 text-slate-200 border-slate-300/50' :
                          'bg-amber-800/20 text-amber-500 border-amber-800/50'
                        }`}>
                          {player.tier}
                        </span>
                      </td>

                      {/* AI Rating */}
                      <td className="py-4 px-4 text-center font-black text-sm text-emerald-400">
                        {player.overallScore}
                      </td>

                      {/* Verification Badge */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {player.verificationStatus.parentVerified && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Parent Consent Verified" />
                          )}
                          {player.verificationStatus.aiffCrsId ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                              AIFF CRS
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Standard</span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPlayer(player);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-[11px] text-slate-300 transition-all"
                        >
                          View Scorecard
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
};

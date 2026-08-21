import React, { useState } from 'react';
import { PlayerProfile, ScoutProfile, ScoutAlert, MessageRequest } from '../types';
import { Search, Flame, Bookmark, Send, ShieldCheck, Filter, Star, Sparkles, MapPin, UserCheck, MessageSquare, CheckCircle, X } from 'lucide-react';

interface ScoutPortalProps {
  scout: ScoutProfile;
  players: PlayerProfile[];
  alerts: ScoutAlert[];
  activeTab: string;
  onSendContactRequest: (req: Partial<MessageRequest>) => void;
  onUpdateScoutNote: (playerId: string, note: string) => void;
  onToggleShortlist: (playerId: string) => void;
}

export const ScoutPortal: React.FC<ScoutPortalProps> = ({
  scout,
  players,
  alerts,
  activeTab,
  onSendContactRequest,
  onUpdateScoutNote,
  onToggleShortlist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [minSpeed, setMinSpeed] = useState(0);

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);

  const indianStates = ['All', 'Kerala', 'Punjab', 'West Bengal', 'Mizoram', 'Goa', 'Maharashtra', 'Karnataka'];

  const filteredPlayers = players.filter(p => {
    if (selectedPosition !== 'All' && p.position !== selectedPosition) return false;
    if (selectedState !== 'All' && p.state !== selectedState) return false;
    if (selectedTier !== 'All' && p.tier !== selectedTier) return false;
    if (minSpeed > 0 && p.speedScore < minSpeed) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.currentAcademy.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenPlayerDetail = (p: PlayerProfile) => {
    setSelectedPlayer(p);
    setNoteText(scout.notes[p.id] || '');
    setShowMessageForm(false);
    setMessageSentSuccess(false);
  };

  const handleSaveNote = () => {
    if (selectedPlayer) {
      onUpdateScoutNote(selectedPlayer.id, noteText);
    }
  };

  const handleSendMonitoredMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    onSendContactRequest({
      scoutId: scout.id,
      scoutName: scout.name,
      clubName: scout.clubOrAcademy,
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      guardianPhone: selectedPlayer.guardianPhone || '+91 98000 00000',
      subject: messageSubject || 'Official Scout Invitation',
      message: messageBody,
      status: 'PENDING_GUARDIAN_APPROVAL',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });

    setMessageSentSuccess(true);
    setShowMessageForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Scout Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={scout.avatar}
            alt={scout.name}
            className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">{scout.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified Club Scout
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {scout.role} • <span className="text-slate-200 font-semibold">{scout.clubOrAcademy}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Shortlisted Prospects</span>
            <span className="text-base font-extrabold text-emerald-400">{scout.shortlistedPlayerIds.length}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Gold Breakthroughs</span>
            <span className="text-base font-extrabold text-amber-400">{alerts.length}</span>
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'talent-search' && (
        <div className="space-y-6">
          
          {/* Filters */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search prospect by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2.5 px-3 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">⚽ All Positions</option>
                <option value="Central Mid">Central Mid</option>
                <option value="Striker">Striker</option>
                <option value="Winger">Winger</option>
                <option value="Attacking Mid">Attacking Mid</option>
                <option value="Center Back">Center Back</option>
                <option value="Full Back">Full Back</option>
              </select>
            </div>

            <div>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2.5 px-3 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">📍 All Regions</option>
                {indianStates.filter(s => s !== 'All').map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2.5 px-3 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">🏅 All Tiers</option>
                <option value="GOLD">Gold Tier</option>
                <option value="SILVER">Silver Tier</option>
                <option value="BRONZE">Bronze Tier</option>
              </select>
            </div>

            <div>
              <select
                value={minSpeed}
                onChange={(e) => setMinSpeed(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2.5 px-3 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value={0}>⚡ Min Speed Score: Any</option>
                <option value={85}>Speed &gt; 85 Rating</option>
                <option value={90}>Speed &gt; 90 (Pro Acceleration)</option>
              </select>
            </div>
          </div>

          {/* Prospects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map(player => {
              const isShortlisted = scout.shortlistedPlayerIds.includes(player.id);
              return (
                <div
                  key={player.id}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 space-y-4 transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
                  onClick={() => handleOpenPlayerDetail(player)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                          {player.name}
                          {player.verificationStatus.aiffCrsId && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </h4>
                        <p className="text-xs text-slate-400">
                          U{player.age} • <span className="text-emerald-400">{player.position}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleShortlist(player.id);
                      }}
                      className={`p-2 rounded-xl border transition-colors ${
                        isShortlisted
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title={isShortlisted ? 'Remove from shortlist' : 'Shortlist player'}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Rating & Location Bar */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{player.city}, {player.state}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        player.tier === 'GOLD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                        player.tier === 'SILVER' ? 'bg-slate-300/20 text-slate-200 border-slate-300/50' :
                        'bg-amber-800/20 text-amber-500 border-amber-800/50'
                      }`}>
                        {player.tier}
                      </span>
                      <span className="text-sm font-black text-emerald-400">
                        {player.overallScore} <span className="text-[10px] text-slate-500 font-normal">AI</span>
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics Pill Grid */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Speed</span>
                      <span className="font-bold text-slate-200">{player.speedScore}</span>
                    </div>
                    <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Agility</span>
                      <span className="font-bold text-slate-200">{player.agilityScore}</span>
                    </div>
                    <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Ball Control</span>
                      <span className="font-bold text-slate-200">{player.ballControlScore}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Scout Gold Alerts View */}
      {activeTab === 'scout-alerts' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Gold Tier Breakthrough Alerts
          </h3>
          <p className="text-xs text-slate-400">
            Real-time notifications triggered when grassroots players hit top national benchmark standards.
          </p>

          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{alert.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const p = players.find(x => x.id === alert.playerId);
                    if (p) handleOpenPlayerDetail(p);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap"
                >
                  Inspect Prospect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scout Shortlists View */}
      {activeTab === 'scout-shortlist' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-400" />
            My Scout Shortlist ({scout.shortlistedPlayerIds.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.filter(p => scout.shortlistedPlayerIds.includes(p.id)).map(player => (
              <div
                key={player.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 cursor-pointer hover:border-emerald-500/40"
                onClick={() => handleOpenPlayerDetail(player)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={player.photo} alt={player.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-white text-sm">{player.name}</h4>
                      <p className="text-xs text-slate-400">{player.position} • {player.state}</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-400">{player.overallScore}</span>
                </div>

                {scout.notes[player.id] && (
                  <p className="text-xs text-slate-300 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    "{scout.notes[player.id]}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl my-8">
            
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-start gap-4 pr-8">
              <img src={selectedPlayer.photo} alt={selectedPlayer.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedPlayer.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {selectedPlayer.tier} TIER
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  U{selectedPlayer.age} • {selectedPlayer.position} • {selectedPlayer.city}, {selectedPlayer.state}
                </p>
                <p className="text-xs text-slate-300 mt-1">Academy: {selectedPlayer.currentAcademy}</p>
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Overall</span>
                <span className="font-bold text-emerald-400 text-sm">{selectedPlayer.overallScore}</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Speed</span>
                <span className="font-bold text-white">{selectedPlayer.speedScore}</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Agility</span>
                <span className="font-bold text-white">{selectedPlayer.agilityScore}</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Control</span>
                <span className="font-bold text-white">{selectedPlayer.ballControlScore}</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Technical</span>
                <span className="font-bold text-white">{selectedPlayer.technicalScore}</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Physical</span>
                <span className="font-bold text-white">{selectedPlayer.physicalScore}</span>
              </div>
            </div>

            {/* Private Scout Notes */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-slate-200 block">Private Scout Evaluation Note:</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add private scout observation (e.g. Explosive sprint acceleration, great vision...)"
                className="w-full bg-slate-900 border border-slate-700 text-xs text-white p-2.5 rounded-lg focus:border-emerald-500 focus:outline-none"
                rows={2}
              />
              <button
                onClick={handleSaveNote}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg"
              >
                Save Private Note
              </button>
            </div>

            {/* Monitored Contact Form (Zero Open DM compliance) */}
            {showMessageForm ? (
              <form onSubmit={handleSendMonitoredMessage} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Monitored Club Contact Request (Zero Open-DM Policy)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Message will be delivered to Parent/Guardian phone ({selectedPlayer.guardianPhone}) for official consent approval.
                </p>

                <input
                  type="text"
                  placeholder="Subject (e.g. Official Trial Invitation)"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white"
                  required
                />
                <textarea
                  placeholder="Official message detailing club opportunity..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white"
                  rows={3}
                  required
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMessageForm(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Official Request
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between pt-2">
                {messageSentSuccess ? (
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-4 h-4" /> Official contact request delivered to guardian!
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMessageForm(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Monitored Club Contact Request
                  </button>
                )}

                <button
                  onClick={() => onToggleShortlist(selectedPlayer.id)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {scout.shortlistedPlayerIds.includes(selectedPlayer.id) ? 'Shortlisted' : 'Add to Shortlist'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Role, UserAccount } from '../types';
import {
  ShieldCheck,
  Trophy,
  Search,
  UserCheck,
  Settings,
  Bell,
  User,
  LogIn,
  LogOut,
  Sparkles,
  Flame,
  History,
  ChevronDown,
  Home
} from 'lucide-react';

interface NavbarProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  goldAlertsCount: number;
  unreadMessagesCount: number;
  playerName: string;
  currentUserAccount?: UserAccount | null;
  onOpenAuthModal: () => void;
  onOpenAuditLogs?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  goldAlertsCount,
  unreadMessagesCount,
  playerName,
  currentUserAccount,
  onOpenAuthModal,
  onOpenAuditLogs,
  onLogout
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (role: Role) => {
    if (role === 'GUEST') {
      onLogout();
    } else {
      onRoleChange(role);
      // Only switch tab if currently on a role portal that doesn't match the new role
      if (
        activeTab === 'talent-search' ||
        activeTab === 'scout-alerts' ||
        activeTab === 'parent-consent' ||
        activeTab === 'parent-messages' ||
        activeTab === 'admin-overview' ||
        activeTab === 'admin-verification'
      ) {
        if (role === 'PLAYER' || role === 'USER') onTabChange('dashboard');
        else if (role === 'SCOUT') onTabChange('talent-search');
        else if (role === 'PARENT') onTabChange('parent-consent');
        else if (role === 'ADMIN') onTabChange('admin-overview');
        else onTabChange('community');
      }
    }
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo */}
          <div
            onClick={() => onTabChange('community')}
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <Trophy className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-white">
                  DIGITAL SCOUT
                </span>
                <span className="px-1 py-0.2 text-[9px] font-black tracking-wider text-amber-300 bg-amber-950/80 border border-amber-500/30 rounded uppercase">
                  INDIA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Grassroots Football & AI Scouting
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => onTabChange('community')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'community'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home Feed
            </button>

            <button
              onClick={() => onTabChange('discover')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'discover'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Discover
            </button>

            <button
              onClick={() => onTabChange('leaderboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Leaderboard
            </button>

            <button
              onClick={() => onTabChange('drills')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'drills'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Trials
            </button>

            {/* Role-Specific Navigation Buttons */}
            {(currentRole === 'PLAYER' || currentRole === 'USER') && (
              <button
                onClick={() => onTabChange('dashboard')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {currentRole === 'USER' ? '⚡ Become a Player' : 'My Football'}
              </button>
            )}

            {currentRole === 'SCOUT' && (
              <button
                onClick={() => onTabChange('talent-search')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'talent-search' || activeTab === 'scout-alerts'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Scout Portal
              </button>
            )}

            {currentRole === 'PARENT' && (
              <button
                onClick={() => onTabChange('parent-consent')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'parent-consent'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Parent Safety
              </button>
            )}

            {currentRole === 'ADMIN' && (
              <button
                onClick={() => onTabChange('admin-overview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'admin-overview'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Admin Console
              </button>
            )}
          </nav>

          {/* Right Actions: Role Selector, Notifications & Profile/Auth */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Quick Role Switcher Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-inner">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 hidden sm:inline">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => handleRoleSelect(e.target.value as Role)}
                className="bg-transparent text-emerald-400 text-xs font-black focus:outline-none cursor-pointer"
              >
                <option value="GUEST" className="bg-slate-900 text-slate-300">🌐 Guest / Fan</option>
                <option value="USER" className="bg-slate-900 text-emerald-400">👤 Member</option>
                <option value="PLAYER" className="bg-slate-900 text-emerald-400">⚽ Player</option>
                <option value="SCOUT" className="bg-slate-900 text-amber-400">🔍 Scout</option>
                <option value="PARENT" className="bg-slate-900 text-teal-400">🛡️ Parent</option>
                <option value="ADMIN" className="bg-slate-900 text-rose-400">⚙️ Admin</option>
              </select>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => {
                if (currentRole === 'SCOUT') onTabChange('scout-alerts');
                else if (currentRole === 'PARENT') onTabChange('parent-messages');
                else onTabChange('community');
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 relative transition-colors cursor-pointer"
              title="Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {(goldAlertsCount > 0 || unreadMessagesCount > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center animate-pulse">
                  {goldAlertsCount + unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Auth / Profile & Log Out Section */}
            {!currentUserAccount ? (
              <button
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In / Sign Up</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative" ref={menuRef}>
                  {/* User Profile Button */}
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="max-w-[90px] sm:max-w-[130px] truncate">{playerName}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Account & Role Menu Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                      
                      {/* User Header */}
                      <div className="border-b border-slate-800 pb-3">
                        <p className="text-xs text-slate-400 font-medium">Logged in as</p>
                        <p className="text-sm font-black text-white truncate">{playerName}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {currentRole} ROLE ACTIVE
                        </span>
                      </div>

                      {/* Switch Role Selection */}
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 mb-2">Switch Active Role:</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <button
                            onClick={() => handleRoleSelect('USER')}
                            className={`p-2 rounded-xl text-left font-bold transition-colors cursor-pointer border ${
                              currentRole === 'USER'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            👤 Member
                          </button>

                          <button
                            onClick={() => handleRoleSelect('PLAYER')}
                            className={`p-2 rounded-xl text-left font-bold transition-colors cursor-pointer border ${
                              currentRole === 'PLAYER'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            ⚽ Player
                          </button>

                          <button
                            onClick={() => handleRoleSelect('SCOUT')}
                            className={`p-2 rounded-xl text-left font-bold transition-colors cursor-pointer border ${
                              currentRole === 'SCOUT'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            🔍 Scout
                          </button>

                          <button
                            onClick={() => handleRoleSelect('PARENT')}
                            className={`p-2 rounded-xl text-left font-bold transition-colors cursor-pointer border ${
                              currentRole === 'PARENT'
                                ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            🛡️ Parent
                          </button>

                          <button
                            onClick={() => handleRoleSelect('ADMIN')}
                            className={`p-2 rounded-xl text-left font-bold transition-colors cursor-pointer border ${
                              currentRole === 'ADMIN'
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            ⚙️ Admin
                          </button>

                          <button
                            onClick={() => handleRoleSelect('GUEST')}
                            className="p-2 rounded-xl text-left font-bold bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer"
                          >
                            🌐 Guest
                          </button>
                        </div>
                      </div>

                      {/* Quick Portal Navigation */}
                      <div className="pt-2 border-t border-slate-800 space-y-1">
                        <button
                          onClick={() => { onTabChange('profile'); setIsProfileMenuOpen(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 flex items-center gap-2 cursor-pointer border border-slate-700"
                        >
                          <User className="w-3.5 h-3.5 text-emerald-400" /> My Profile & Identity
                        </button>

                        <button
                          onClick={() => { onTabChange('community'); setIsProfileMenuOpen(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                        >
                          <Home className="w-3.5 h-3.5 text-emerald-400" /> Home Feed
                        </button>

                        <button
                          onClick={() => { onTabChange('dashboard'); setIsProfileMenuOpen(false); }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-400" /> My Football Dashboard
                        </button>

                        {currentRole === 'SCOUT' && (
                          <button
                            onClick={() => { onTabChange('talent-search'); setIsProfileMenuOpen(false); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <Search className="w-3.5 h-3.5 text-amber-400" /> Scout Talent Portal
                          </button>
                        )}

                        {currentRole === 'PARENT' && (
                          <button
                            onClick={() => { onTabChange('parent-consent'); setIsProfileMenuOpen(false); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Parent Safety Center
                          </button>
                        )}

                        {currentRole === 'ADMIN' && (
                          <button
                            onClick={() => { onTabChange('admin-overview'); setIsProfileMenuOpen(false); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-rose-400" /> Admin Console
                          </button>
                        )}

                        {onOpenAuditLogs && (
                          <button
                            onClick={() => { setIsProfileMenuOpen(false); onOpenAuditLogs(); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5 text-emerald-400" /> Audit Trail Logs
                          </button>
                        )}
                      </div>

                      {/* Prominent Red Log Out Button inside Dropdown */}
                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => { setIsProfileMenuOpen(false); onLogout(); }}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out Now</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>

                {/* Direct Log Out Button */}
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Log Out of Digital Scout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Log Out</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Mobile Navigation Sub-bar with Complete Access */}
        <div className="flex lg:hidden items-center justify-between py-2 border-t border-slate-800/80 text-xs overflow-x-auto gap-2">
          
          <div className="flex items-center gap-1 overflow-x-auto shrink-0">
            <button
              onClick={() => onTabChange('community')}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap ${
                activeTab === 'community' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Home Feed
            </button>
            <button
              onClick={() => onTabChange('discover')}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap ${
                activeTab === 'discover' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => onTabChange('leaderboard')}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap ${
                activeTab === 'leaderboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => onTabChange('drills')}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap ${
                activeTab === 'drills' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Trials
            </button>

            {(currentRole === 'PLAYER' || currentRole === 'USER') && (
              <button
                onClick={() => onTabChange('dashboard')}
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                {currentRole === 'USER' ? 'Become Player' : 'My Football'}
              </button>
            )}

            {currentRole === 'SCOUT' && (
              <button
                onClick={() => onTabChange('talent-search')}
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap ${
                  activeTab === 'talent-search' || activeTab === 'scout-alerts' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Scout Portal
              </button>
            )}

            {currentRole === 'PARENT' && (
              <button
                onClick={() => onTabChange('parent-consent')}
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap ${
                  activeTab === 'parent-consent' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Parent Safety
              </button>
            )}

            {currentRole === 'ADMIN' && (
              <button
                onClick={() => onTabChange('admin-overview')}
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap ${
                  activeTab === 'admin-overview' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Admin Console
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { AuditLog, UserAccount } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { ShieldCheck, X, Search, Filter, Clock, User, Activity, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  currentRole: string;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentRole
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, currentUser, currentRole]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const fetchedLogs: AuditLog[] = [];

      // If user is logged in, fetch from their user-wise subcollection first
      if (currentUser?.id) {
        try {
          const userLogsRef = collection(db, 'users', currentUser.id, 'auditLogs');
          const snap = await getDocs(userLogsRef);
          snap.forEach(docSnap => {
            fetchedLogs.push(docSnap.data() as AuditLog);
          });
        } catch (subErr) {
          console.warn("User subcollection logs note:", subErr);
        }
      }

      // Also try global collection
      try {
        const globalLogsRef = collection(db, 'auditLogs');
        const snap = await getDocs(globalLogsRef);
        snap.forEach(docSnap => {
          const data = docSnap.data() as AuditLog;
          // Avoid duplicate entries
          if (!fetchedLogs.some(l => l.id === data.id)) {
            if (currentRole === 'ADMIN' || data.userId === currentUser?.id || !currentUser) {
              fetchedLogs.push(data);
            }
          }
        });
      } catch (globalErr) {
        console.warn("Global logs note:", globalErr);
      }

      // Sort descending by timestamp
      fetchedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(fetchedLogs);
    } catch (err) {
      console.error("Audit log fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const matchesQuery = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedActionType === 'ALL' || log.actionType === selectedActionType;

    return matchesQuery && matchesFilter;
  });

  const getBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'USER_REGISTER':
      case 'USER_LOGIN':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'USER_LOGOUT':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'QUALIFICATION_START':
      case 'QUALIFICATION_SUBMIT':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'DRILL_ATTEMPT_SUBMIT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'POST_CREATE':
      case 'POST_LIKE':
      case 'POST_COMMENT':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'SUBSCRIPTION_CHANGE':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 p-6 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                User Transaction Audit Trail
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  Immutable Firestore Logs
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                User: <strong className="text-slate-200">{currentUser?.displayName || 'Active Session User'}</strong> ({currentUser?.id || 'usr-registered-101'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search event logs, actions, details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white pl-9 pr-3 py-2.5 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2.5 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="USER_REGISTER">User Registration</option>
              <option value="QUALIFICATION_START">Qualification Started</option>
              <option value="QUALIFICATION_SUBMIT">Qualification Submitted</option>
              <option value="DRILL_ATTEMPT_SUBMIT">Drill Submissions</option>
              <option value="POST_CREATE">Post Creation</option>
              <option value="POST_LIKE">Post Likes</option>
              <option value="SUBSCRIPTION_CHANGE">Subscription Changes</option>
            </select>
          </div>
        </div>

        {/* Audit Log Timeline View */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <span>Fetching secure Firestore audit records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <Activity className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-bold text-slate-300">No Transaction Audit Logs Found</p>
              <p className="text-[11px] text-slate-500">Perform user actions (e.g. register, submit drills, post updates) to generate audit logs.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${getBadgeColor(log.actionType)}`}>
                      {log.actionType}
                    </span>
                    <span className="text-xs font-bold text-white">{log.userName}</span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                      {log.userRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : 'Just now'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {log.description}
                </p>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-0.5">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Metadata Parameters:</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1">
                      {Object.entries(log.metadata).map(([k, v]) => (
                        <div key={k} className="truncate">
                          <span className="text-slate-500">{k}:</span> <span className="text-slate-300">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Audit logs are stored in Firestore & immutable by security rules.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Audit Trail
          </button>
        </div>

      </div>
    </div>
  );
};

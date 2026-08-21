import React, { useState } from 'react';
import { UserAccount } from '../types';
import { X, Camera, Check, AlertCircle, Sparkles, User, MapPin, AlignLeft } from 'lucide-react';
import { logAuditTransaction } from '../lib/auditLogger';

interface EditProfileModalProps {
  user: UserAccount;
  onClose: () => void;
  onProfileUpdated: (updatedUser: UserAccount) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onProfileUpdated }) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [displayName, setDisplayName] = useState(user.displayName || `${user.firstName} ${user.lastName}`);
  const [username, setUsername] = useState(user.username || user.displayName.toLowerCase().replace(/\s+/g, ''));
  const [bio, setBio] = useState(user.bio || '');
  const [city, setCity] = useState(user.city || 'Kochi');
  const [district, setDistrict] = useState(user.district || 'Ernakulam');
  const [state, setState] = useState(user.state || 'Kerala');
  const [photoUrl, setPhotoUrl] = useState(user.profilePhoto || PRESET_AVATARS[0]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.toLowerCase().trim().replace(/^@/, '');
    if (!cleanUsername) {
      setError('Please enter a valid username / handle.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/v1/me/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          firstName,
          lastName,
          displayName,
          username: cleanUsername,
          bio,
          city,
          district,
          state,
          profilePhoto: photoUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      const updated = data.user || {
        ...user,
        firstName,
        lastName,
        displayName,
        username: cleanUsername,
        bio,
        city,
        district,
        state,
        profilePhoto: photoUrl
      };

      // Audit Log
      await logAuditTransaction(
        user.id,
        displayName,
        user.role,
        'PROFILE_UPDATE',
        `Updated user profile details (@${cleanUsername})`,
        { username: cleanUsername, city, state }
      );

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onProfileUpdated(updated);
        onClose();
      }, 800);

    } catch (err: any) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">Edit Profile & Identity</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Photo Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" /> Profile Photo & Avatar
            </label>
            
            <div className="flex items-center gap-4">
              <img
                src={photoUrl}
                alt="Selected Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
              />
              <div className="space-y-1.5 flex-1">
                <p className="text-[11px] text-slate-400 font-medium">Choose a preset avatar or paste image URL:</p>
                <div className="flex gap-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(preset)}
                      className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        photoUrl === preset ? 'border-emerald-400 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Display Name & Username Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Username / Handle</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-emerald-400">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" /> Grassroots Location
            </label>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">City</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">District</span>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">State</span>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-emerald-400" /> Bio / Tagline
              </label>
              <span className="text-[10px] text-slate-500">{bio.length}/160</span>
            </div>
            <textarea
              maxLength={160}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell scouts and the community about your football journey, favorite position, or grassroots goals..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

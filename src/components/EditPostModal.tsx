import React, { useState } from 'react';
import { CommunityPost, PostVisibility } from '../types';
import { X, Save, Trash2, ShieldAlert, Hash, MapPin, Eye, AlertCircle } from 'lucide-react';
import { logAuditTransaction } from '../lib/auditLogger';

interface EditPostModalProps {
  post: CommunityPost;
  currentUserId: string;
  onClose: () => void;
  onPostUpdated: (updatedPost: CommunityPost) => void;
  onPostDeleted: (postId: string) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  currentUserId,
  onClose,
  onPostUpdated,
  onPostDeleted
}) => {
  const [caption, setCaption] = useState(post.caption || post.title || '');
  const [hashtagsInput, setHashtagsInput] = useState((post.hashtags || []).join(', '));
  const [locationName, setLocationName] = useState(post.locationName || post.authorState || '');
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility || 'PUBLIC');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const hashtagsArray = hashtagsInput.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const response = await fetch(`/api/v1/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({
          caption,
          hashtags: hashtagsArray,
          locationName,
          visibility
        })
      });

      const data = await response.json();
      if (data.success) {
        onPostUpdated(data.post);
        await logAuditTransaction(
          currentUserId,
          post.authorName,
          'PLAYER',
          'POST_UPDATED',
          `Edited post metadata for post ${post.id}`,
          { postId: post.id }
        );
        onClose();
      } else {
        setErrorMsg(data.message || "Failed to update post.");
      }
    } catch (err) {
      console.error("Error updating post:", err);
      setErrorMsg("Failed to connect to Digital Scout server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/v1/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUserId
        }
      });

      const data = await response.json();
      if (data.success) {
        onPostDeleted(post.id);
        await logAuditTransaction(
          currentUserId,
          post.authorName,
          'PLAYER',
          'POST_DELETED',
          `Soft-deleted post ${post.id}`,
          { postId: post.id }
        );
        onClose();
      } else {
        setErrorMsg(data.message || "Failed to delete post.");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      setErrorMsg("Failed to connect to Digital Scout server.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Edit Post Details</h3>
            <p className="text-xs text-slate-400">CONTENT-023: Update caption, hashtags & visibility</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Protected Notice */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[11px] text-blue-300">
          <span className="font-bold block">🔒 Immutability Protection</span>
          Original media file, author ownership, and AI trial scores are protected and cannot be modified.
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Caption</label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-emerald-400" /> Hashtags
            </label>
            <input
              type="text"
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-400" /> Pitch / Location Tag
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-400" /> Post Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PostVisibility)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="PUBLIC">🌍 Public</option>
              <option value="FOLLOWERS_ONLY">👥 Followers Only</option>
              <option value="PRIVATE">🔒 Private</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Post
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {showConfirmDelete && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4">
            <ShieldAlert className="w-12 h-12 text-red-400" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Delete Post Confirmation</h4>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove this post? It will be soft-deleted from the public feed.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSoftDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

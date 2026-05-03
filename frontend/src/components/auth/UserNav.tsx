import React from "react";
import { useAuth } from "../../context/AuthContext";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";

function isSafeImageUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const UserNav: React.FC = () => {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div
        className="h-8 w-8 rounded-full bg-slate-200 animate-pulse"
        role="status"
        aria-label="Loading user"
        aria-busy="true"
      />
    );
  }

  if (!user) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-primary bg-white border border-[#E8E4DA] rounded-full hover:bg-[#F9F8F0] transition-all shadow-sm"
        aria-label="Sign in with Google"
      >
        <LogIn size={16} className="text-accent" aria-hidden="true" />
        <span>Sign In</span>
      </button>
    );
  }

  const safePhoto = isSafeImageUrl(user.photoURL) ? user.photoURL : null;
  const displayName = user.displayName || "Citizen";

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {safePhoto ? (
          <img
            src={safePhoto}
            alt={`${displayName}'s profile picture`}
            className="h-8 w-8 rounded-full border border-accent/20 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent"
            aria-hidden="true"
          >
            <UserIcon size={18} />
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-xs font-bold text-text-primary line-clamp-1">
            {displayName}
          </p>
          <p className="text-[10px] text-text-muted uppercase tracking-tighter">
            Verified Voter
          </p>
        </div>
      </div>

      <button
        onClick={logout}
        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        aria-label={`Sign out ${displayName}`}
        title="Sign Out"
      >
        <LogOut size={18} aria-hidden="true" />
      </button>
    </div>
  );
};

export default UserNav;

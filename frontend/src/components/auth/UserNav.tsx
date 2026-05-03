import React from "react";
import { useAuth } from "../../context/AuthContext";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";

const UserNav: React.FC = () => {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-primary bg-white border border-[#E8E4DA] rounded-full hover:bg-[#F9F8F0] transition-all shadow-sm"
      >
        <LogIn size={16} className="text-accent" />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 group cursor-default">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="h-8 w-8 rounded-full border border-accent/20 object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <UserIcon size={18} />
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-xs font-bold text-text-primary line-clamp-1">
            {user.displayName || "Citizen"}
          </p>
          <p className="text-[10px] text-text-muted uppercase tracking-tighter">
            Verified Voter
          </p>
        </div>
      </div>

      <button
        onClick={logout}
        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        title="Sign Out"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
};

export default UserNav;

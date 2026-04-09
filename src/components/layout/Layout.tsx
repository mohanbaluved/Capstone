import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.tsx";
import { Button } from "../ui/button.tsx";
import { LogOut, LayoutDashboard, Code, BookOpen, User } from "lucide-react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Code className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight">AdaptiveAI</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/assessment" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Assessments
                </Link>
                <Link to="/learning" className="text-sm font-medium text-neutral-600 hover:text-black transition-colors flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Learning
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3 pr-4 border-r border-neutral-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold">{user.user_metadata.full_name || user.email}</p>
                    <p className="text-xs text-neutral-500">{profile?.skillLevel} • {Math.round(profile?.skillScore || 0)} pts</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden">
                    {user.user_metadata.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-full h-full p-1.5 text-neutral-400" />
                    )}
                  </div>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-neutral-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-500 text-sm">
          © 2026 AdaptiveAI Assessment Platform. Built with Google Gemini.
        </div>
      </footer>
    </div>
  );
};

export default Layout;

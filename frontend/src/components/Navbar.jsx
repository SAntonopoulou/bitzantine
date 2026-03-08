import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfileMenu = () => setIsProfileOpen(!isProfileOpen);

  // Close profile dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuRef]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const desktopLinkStyles = "hover:text-amber-400 transition-colors";
  const mobileLinkStyles = "text-lg p-4 hover:bg-stone-700 rounded-md transition-colors block";
  
  const MobileNav = () => (
    <>
      <div 
        className={`fixed top-0 left-0 h-full w-full bg-black/50 z-50 transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleMenu}
      ></div>
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-stone-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-stone-700 flex-shrink-0">
          <Link to="/" onClick={toggleMenu} className="font-bold text-xl text-amber-500">Bitzantium</Link>
        </div>
        <div className="flex-grow overflow-y-auto">
          <div className="flex flex-col space-y-2 p-4">
            <Link to="/announcements" className={mobileLinkStyles} onClick={toggleMenu}>Announcements</Link>
            <Link to="/events" className={mobileLinkStyles} onClick={toggleMenu}>Events</Link>
            <Link to="/government" className={mobileLinkStyles} onClick={toggleMenu}>Government</Link>
            <Link to="/lore" className={mobileLinkStyles} onClick={toggleMenu}>Lore</Link>
            {user ? (
              <>
                <hr className="border-stone-700 my-2"/>
                <Link to="/groups" className={mobileLinkStyles} onClick={toggleMenu}>Groups</Link>
                <Link to="/polls" className={mobileLinkStyles} onClick={toggleMenu}>Polls</Link>
                <Link to={`/profile/${user.username}`} className={mobileLinkStyles} onClick={toggleMenu}>Profile</Link>
                <Link to="/settings" className={mobileLinkStyles} onClick={toggleMenu}>Settings</Link>
                {['admin', 'super_admin'].includes(user.role) && (
                  <Link to="/admin" className={mobileLinkStyles} onClick={toggleMenu}>Admin</Link>
                )}
                <button onClick={() => { logout(); toggleMenu(); }} className="w-full bg-red-800/50 border border-red-700 px-3 py-3 rounded-md hover:bg-red-800 text-left transition-colors text-lg">Logout</button>
              </>
            ) : (
              <>
                <hr className="border-stone-700 my-2"/>
                <Link to="/login" className={mobileLinkStyles} onClick={toggleMenu}>Login</Link>
                <Link to="/join" className="w-full bg-blue-600 px-3 py-3 rounded-md hover:bg-blue-700 text-left transition-colors text-lg">Join</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const DesktopNav = () => (
    <div className="hidden md:flex items-center space-x-6">
      <Link to="/announcements" className={desktopLinkStyles}>Announcements</Link>
      <Link to="/events" className={desktopLinkStyles}>Events</Link>
      <Link to="/government" className={desktopLinkStyles}>Government</Link>
      <Link to="/lore" className={desktopLinkStyles}>Lore</Link>
      
      <div className="w-px h-6 bg-stone-700"></div>

      {user ? (
        <div className="relative" ref={profileMenuRef}>
          <button onClick={toggleProfileMenu} className="flex items-center gap-2 hover:bg-stone-700 p-2 rounded-md transition-colors">
            <img 
              src={user.avatar_url ? `${API_URL}${user.avatar_url}` : `https://ui-avatars.com/api/?name=${user.display_name || user.username}&background=292524&color=f59e0b`} 
              alt="avatar" 
              className="w-8 h-8 rounded-full object-cover" 
            />
            <span className="font-medium text-stone-200">{user.display_name || user.username}</span>
            <ChevronDown size={16} className={`text-stone-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-stone-800 border border-stone-700 rounded-md shadow-lg z-20 py-1">
              <Link to="/groups" className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700" onClick={toggleProfileMenu}>Groups</Link>
              <Link to="/polls" className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700" onClick={toggleProfileMenu}>Polls</Link>
              <Link to={`/profile/${user.username}`} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700" onClick={toggleProfileMenu}>My Profile</Link>
              <Link to="/settings" className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700" onClick={toggleProfileMenu}>Settings</Link>
              {['admin', 'super_admin'].includes(user.role) && (
                <>
                  <div className="my-1 h-px bg-stone-700"></div>
                  <Link to="/admin" className="block px-4 py-2 text-sm text-amber-400 hover:bg-stone-700" onClick={toggleProfileMenu}>Admin</Link>
                </>
              )}
              <div className="my-1 h-px bg-stone-700"></div>
              <button onClick={() => { logout(); toggleProfileMenu(); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Logout</button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <Link to="/login" className={desktopLinkStyles}>Login</Link>
          <Link to="/join" className="bg-amber-600 px-4 py-2 rounded-md hover:bg-amber-700 transition-colors font-medium">Join</Link>
        </div>
      )}
    </div>
  );

  return (
    <nav className="bg-stone-800 p-4 text-white sticky top-0 z-40 border-b border-stone-700">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="font-bold text-xl text-amber-500">Bitzantium</Link>
        <div className="md:hidden">
          <button onClick={toggleMenu} className="focus:outline-none p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
        <DesktopNav />
      </div>
      <MobileNav />
    </nav>
  );
}

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link to="/" className="font-bold text-xl">GuildApp</Link>
        <Link to="/announcements" className="hover:text-gray-300">Announcements</Link>
        <Link to="/events" className="hover:text-gray-300">Events</Link>
        <Link to="/government" className="hover:text-gray-300">Government</Link>
        <Link to="/lore" className="hover:text-gray-300">Lore</Link>
      </div>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Link to="/groups" className="hover:text-gray-300">Groups</Link>
            <Link to="/vote" className="hover:text-gray-300">Vote</Link>
            <Link to="/profile/me" className="hover:text-gray-300">Profile</Link>
            <Link to="/settings" className="hover:text-gray-300">Settings</Link>
            {['admin', 'super_admin'].includes(user.role) && (
              <Link to="/admin" className="hover:text-gray-300">Admin</Link>
            )}
            <button onClick={logout} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-gray-300">Login</Link>
            <Link to="/join" className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-600">Join</Link>
          </>
        )}
      </div>
    </nav>
  );
}

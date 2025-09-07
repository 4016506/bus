import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/add', label: 'Add Bus', icon: '🚌' },
    { path: '/today', label: "Today's Buses", icon: '📅' },
    { path: '/stats', label: 'Stats', icon: '📊' },
    { path: '/busdle', label: 'Busdle', icon: '🎯' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">Bus Tracker</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium
                    ${isActive 
                      ? 'bg-primary-500/20 text-primary-200 border border-primary-500/30' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="hidden sm:block">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

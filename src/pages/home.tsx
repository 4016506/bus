import NavBar from './NavBar';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <NavBar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-bounce-gentle"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce-gentle" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Title */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-4 animate-fade-in">
                4016506
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full"></div>
            </div>
            
            {/* Subtitle */}
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 animate-slide-up">
              Bus Tracker
            </h2>
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{animationDelay: '0.2s'}}>
              Track your daily bus rides, analyze your transportation patterns, and manage your journey history with style.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{animationDelay: '0.4s'}}>
              <Link to="/add" className="btn-primary text-lg px-8 py-4">
                🚌 Start Tracking
              </Link>
              <Link to="/stats" className="btn-secondary text-lg px-8 py-4">
                📊 View Stats
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-white mb-4">Why Choose Bus Tracker?</h3>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            A modern, intuitive way to track and analyze your daily transportation
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="card group">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="text-2xl font-bold text-white mb-4">Easy Tracking</h4>
              <p className="text-white/70 leading-relaxed">
                Quickly log your bus rides with a simple, intuitive interface. Add buses, light rail, and more in seconds.
              </p>
            </div>
          </div>
          
          {/* Feature 2 */}
          <div className="card group">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="text-2xl font-bold text-white mb-4">Smart Analytics</h4>
              <p className="text-white/70 leading-relaxed">
                View detailed statistics, track patterns over time, and filter data by date ranges for deeper insights.
              </p>
            </div>
          </div>
          
          {/* Feature 3 */}
          <div className="card group">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🎨</span>
              </div>
              <h4 className="text-2xl font-bold text-white mb-4">Beautiful Design</h4>
              <p className="text-white/70 leading-relaxed">
                Enjoy a sleek, modern interface with smooth animations and responsive design that works on any device.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold text-white mb-4">Quick Actions</h3>
          <p className="text-xl text-white/70">Get started with these common tasks</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Link to="/add" className="card text-center group hover:bg-primary-500/20">
            <div className="text-4xl mb-4">🚌</div>
            <h4 className="text-xl font-semibold text-white mb-2">Add Bus</h4>
            <p className="text-white/70 text-sm">Log a new bus ride</p>
          </Link>
          
          <Link to="/today" className="card text-center group hover:bg-purple-500/20">
            <div className="text-4xl mb-4">📅</div>
            <h4 className="text-xl font-semibold text-white mb-2">Today's Rides</h4>
            <p className="text-white/70 text-sm">View today's buses</p>
          </Link>
          
          <Link to="/stats" className="card text-center group hover:bg-green-500/20">
            <div className="text-4xl mb-4">📈</div>
            <h4 className="text-xl font-semibold text-white mb-2">Statistics</h4>
            <p className="text-white/70 text-sm">View your stats</p>
          </Link>
          
          <Link to="/busdle" className="card text-center group hover:bg-yellow-500/20">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="text-xl font-semibold text-white mb-2">Busdle</h4>
            <p className="text-white/70 text-sm">Guess the bus order</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
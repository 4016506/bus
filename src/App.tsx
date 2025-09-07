import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import AddBusPage from './pages/AddBusPage';
import TodaysBusesPage from './pages/TodaysBusesPage';
import StatsPage from './pages/StatsPage';
import BusdlePage from './pages/BusdlePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddBusPage />} />
        <Route path="/today" element={<TodaysBusesPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/busdle" element={<BusdlePage />} />
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Topics from './pages/topics/Topics';
import Navbar from './components/Navbar';
import Awards from './pages/awards/Awards';
import Companies from './pages/companies/Companies';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/companies" element={<Companies />} />
      </Routes>
    </Router>
  );
}

export default App;

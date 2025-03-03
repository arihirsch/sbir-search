import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Topics from './pages/topics/Topics';
import Navbar from './components/Navbar';
import Awards from './pages/awards/Awards';
import Companies from './pages/companies/Companies';
import About from './pages/About.tsx';
import TitleBar from './components/TitleBar.tsx';
import TopicDetail from './pages/topics/TopicDetail';
import AwardDetail from './pages/awards/AwardDetail';
import CompanyDetail from './pages/companies/CompanyDetail';
import { NavbarProvider } from './contexts/NavbarContext';

function App() {
  return (
    <NavbarProvider>
      <Router>
        <TitleBar />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/about" element={<About />} />
          <Route path="/topics/:id" element={<TopicDetail />} />
          <Route path="/awards/:id" element={<AwardDetail />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
        </Routes>
      </Router>
    </NavbarProvider>
  );
}

export default App;

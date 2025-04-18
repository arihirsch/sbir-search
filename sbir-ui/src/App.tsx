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
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <NavbarProvider>
      <Router>
          <TitleBar />
          <Navbar />
          <div className="fixed top-24 left-0 right-0 bottom-0 bg-background z-30 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/topics" element={<Topics />} />
              <Route path="/awards" element={<Awards />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/about" element={<About />} />
              <Route path="/topics/:topicNumber/:solicitationId" element={<TopicDetail />} />
              <Route path="/awards/:id" element={<AwardDetail />} />
              <Route path="/companies/:id" element={<CompanyDetail />} />
            </Routes>
            </div>
          </div>
          <Analytics />
      </Router>
    </NavbarProvider>
  );
}

export default App;

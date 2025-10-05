import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BasicEditor from './components/BasicEditor';
import SharedPageViewer from './components/SharedPageViewer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BasicEditor />} />
        <Route path="/shared/:token" element={<SharedPageViewer />} />
      </Routes>
    </Router>
  );
}

export default App;

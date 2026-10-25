import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CreatePage from './pages/CreatePage';
import PollPage from './pages/PollPage';
import './styles/index.css';
import './mobile.css';

function App() {
  return (
    <BrowserRouter>
      <video
        className="bg-video"
        muted
        autoPlay
        playsInline
        loop
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
        aria-hidden="true"
        src="https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/cloudinarry%20to%20cloudflare/202606021731-e_hqa6sn.mp4"
      />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/poll/:id" element={<PollPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
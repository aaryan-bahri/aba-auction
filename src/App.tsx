import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Admin from './pages/admin'
import Projector from './pages/projector'
import Teams from './pages/teampage'
import Home from './pages/home'

export default function App() {
  return (
     <BrowserRouter basename="/aba-auction/">
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/projector" element={<Projector />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

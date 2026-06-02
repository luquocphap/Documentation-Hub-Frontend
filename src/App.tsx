import './App.css'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import RegisterPage from './pages/RegisterPage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to='/register' replace />} />
        <Route path='/register' element={<RegisterPage/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

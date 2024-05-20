import { ToggleColorMode } from "./components/ToggleColorMode.jsx"
import { Route, Routes } from "react-router-dom"
import Login from "./components/Login.jsx"
import Register from "./components/Register.jsx"
const App = () => {
  return (
    <>
      <ToggleColorMode />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  )
}

export default App

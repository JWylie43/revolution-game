import { ToggleColorMode } from "./components/ToggleColorMode.jsx"
import { Route, Routes } from "react-router-dom"
import Login from "./components/Login.jsx"
import Register from "./components/Register.jsx"
import { AccountProvider } from "./providers/UserProvider.jsx"

const App = () => {
  return (
    <AccountProvider>
      <ToggleColorMode />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/home" element={<div>home</div>} />
        </Route>
        <Route path="*" element={<Login />} />
      </Routes>
    </AccountProvider>
  )
}

export default App

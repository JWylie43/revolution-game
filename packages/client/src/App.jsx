import { ToggleColorMode } from "./components/ToggleColorMode.jsx"
import { Route, Routes } from "react-router-dom"
import Login from "./components/Login.jsx"
import Register from "./components/Register.jsx"
import { AccountProvider } from "./providers/AccountProvider.jsx"
import PrivateRoutes from "./components/PrivateRoutes.jsx"
import Home from "./components/Home.jsx"

const App = () => {
  return (
    <AccountProvider>
      <ToggleColorMode />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<div>default home</div>} />
        </Route>
        <Route path="*" element={<Login />} />
      </Routes>
    </AccountProvider>
  )
}

export default App

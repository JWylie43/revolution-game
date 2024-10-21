import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom"
import { useAccountProvider } from "./providers/AccountProvider.jsx"
import { Login } from "./routes/Login.jsx"
import { Home } from "./routes/Home.jsx"
import { Lobby } from "./routes/Lobby.jsx"
import { SocketProvider, useSocketProvider } from "./providers/SocketProvider.jsx"

const ProtectedRoutes = () => {
  const { socket, connected } = useSocketProvider()
  return socket === null ? (
    <div>Loading...</div>
  ) : connected ? (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Navigate to="/" />} />
      <Route path="/:roomId" element={<Lobby />} /> {/* Direct room path */}
      <Route path="*" element={<div>This is not a valid page.</div>} /> {/* Redirect invalid routes to home */}
    </Routes>
  ) : (
    <div>Issue connecting to socket</div>
  )
}

const App = () => {
  const { accountInfo } = useAccountProvider()
  return accountInfo.loggedIn === null ? (
    <div>Loading...</div>
  ) : accountInfo.loggedIn ? (
    <SocketProvider>
      <div>Username: {accountInfo.username}</div>
      <ProtectedRoutes />
    </SocketProvider>
  ) : (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App

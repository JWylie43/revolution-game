import { Route, Routes } from "react-router-dom"
import { Home } from "./Home/Home"
import { GameRouter } from "./Home/GameRouter"
import { useSocketSetup } from "./Home/useSocketSetup"
export const ProtectedRoutes = () => {
  useSocketSetup()
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:roomId" element={<GameRouter />} />
    </Routes>
  )
}

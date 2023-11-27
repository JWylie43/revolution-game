import { createContext, useState, useEffect, useContext } from "react"

export const GameContext = createContext()
export const useGameProvider = () => {
  return useContext(GameContext)
}
export const GameProvider = ({ children }) => {
  const [socketUser, setSocketUser] = useState({})
  const [players, setPlayers] = useState([])
  const [gameState, setGameState] = useState("")
  const values = {
    socketUser,
    setSocketUser,
    players,
    setPlayers,
    gameState,
    setGameState
  }
  return <GameContext.Provider value={values}>{children}</GameContext.Provider>
}

import { createContext, useState, useEffect, useContext } from "react"

export const GameContext = createContext()
export const useGameProvider = () => {
  return useContext(GameContext)
}
export const GameProvider = ({ children }) => {
  const [gamePlayer, setGamePlayer] = useState(null)
  const [gameState, setGameState] = useState(null)
  const values = {
    gamePlayer,
    setGamePlayer,
    gameState,
    setGameState
  }
  return <GameContext.Provider value={values}>{children}</GameContext.Provider>
}

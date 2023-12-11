import { Button, Grid, GridItem, Text, Box, Flex, Container } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"
import { useState, useEffect, useRef } from "react"
import { Space } from "react-zoomable-ui"
import "../../app.css"

const InfluenceSpaces = ({ location: { id, spaces, influence }, selectedSpaces, setSelectedSpaces }) => {
  const { gameState, gamePlayer } = useGameProvider()
  return Array.from({ length: spaces }, (_, index) => {
    const backgroundColor = gameState.players[influence[index]]?.color || "white"
    const divId = influence[index] ? `${id}-${influence[index]}-${index}` : null
    return (
      <div
        key={index}
        id={divId}
        onClick={(e) => {
          const influenceSpaceId = e.target.id
          if (!influenceSpaceId) {
            return
          }
          if (gameState.phase === "replace" && gamePlayer.replace) {
            setSelectedSpaces((current) => {
              if (selectedSpaces.includes(divId)) {
                return current.filter((id) => {
                  return id !== divId
                })
              } else if (selectedSpaces.length < 1) {
                return [...current, divId]
              }
              return current
            })
            // console.log("influenceId", influenceSpaceId)
            // const [location, player, index] = influenceSpaceId.split("-")
            // if (player !== gamePlayer.username) {
            //   const confirm = window.confirm("Swap out cube")
            //   if (confirm) {
            //     socket.emit("replaceInfluence", { location, index })
            //   }
            // }
          }
          if (gameState.phase === "swap" && gamePlayer.swap) {
            setSelectedSpaces((current) => {
              if (selectedSpaces.includes(divId)) {
                return current.filter((id) => {
                  return id !== divId
                })
              } else if (selectedSpaces.length < 2) {
                return [...current, divId]
              }
              return current
            })
          }
        }}
        style={{ width: "20px", height: "20px", backgroundColor, margin: "5px" }}
      >
        {selectedSpaces.indexOf(divId) !== -1 ? selectedSpaces.indexOf(divId) : ""}
      </div>
    )
  })
}

const BoardLocation = ({ location, selectedSpaces, setSelectedSpaces }) => {
  return (
    <tr key={location.id} style={{ width: "fit-content", border: "1px solid black", padding: "10px" }}>
      <td>{location.name}:</td>
      <td style={{ display: "flex", flexWrap: "wrap" }}>
        {InfluenceSpaces({ location, selectedSpaces, setSelectedSpaces })}
      </td>
    </tr>
  )
}

export const GameBoard = () => {
  const { gameState, gamePlayer } = useGameProvider()
  const [selectedSpaces, setSelectedSpaces] = useState([])

  const [gameBoardState, setGameBoardState] = useState(
    gameState.gameboard.reduce((result, { id, name, spaces, influence }) => {
      Array.from({ length: spaces }, (_, index) => {
        return { id, name, index, player: null, selected: null }
      })
      return [
        ...result,
        ...Array.from({ length: spaces }, (_, index) => {
          return { id, name, index, player: null, selected: null }
        })
      ]
    }, [])
  )
  console.log("gameBoardState", gameBoardState)
  return (
    <>
      {gameState.phase === "replace" && gamePlayer.replace ? (
        <Button
          onClick={() => {
            if (selectedSpaces.length === 1) {
              socket.emit("swapInfluence", selectedSpaces[0])
            }
          }}
        >
          Swap
        </Button>
      ) : (
        ""
      )}
      {gameState.phase === "swap" && gamePlayer.swap ? (
        <Button
          onClick={() => {
            if (selectedSpaces.length === 2) {
              socket.emit("swapInfluence", selectedSpaces)
            }
          }}
        >
          Swap
        </Button>
      ) : (
        ""
      )}
      <table>
        <tbody>
          {gameState.gameboard?.map((location) => {
            return BoardLocation({ location, selectedSpaces, setSelectedSpaces })
          })}
        </tbody>
      </table>
    </>
  )
}

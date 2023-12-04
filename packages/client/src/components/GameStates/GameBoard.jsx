import { Button, Grid, GridItem, Text, Box, Flex, Container } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"
import { useState, useEffect, useRef } from "react"
import { Space } from "react-zoomable-ui"
import "../../app.css"

const InfluenceSpaces = (id, number, influence) => {
  const { gameState } = useGameProvider()
  const divRefs = Array.from({ length: number }, () => useRef(null))

  return Array.from({ length: number }, (_, index) => {
    const backgroundColor = gameState.players[influence[index]]?.color || "white"
    return (
      <div
        key={index}
        id={`${influence[index]}-${index}`}
        onClick={(e) => {
          console.log("playerinfluence", e)
        }}
        style={{ width: "20px", height: "20px", backgroundColor, margin: "5px" }}
      ></div>
    )
  })
}

const BoardLocation = ({ id, name, spaces, influence }) => {
  return (
    <tr key={id} style={{ width: "fit-content", border: "1px solid black", padding: "10px" }}>
      <td>{name}:</td>
      <td style={{ display: "flex", flexWrap: "wrap" }}>{InfluenceSpaces(id, spaces, influence)}</td>
    </tr>
  )
}

export const GameBoard = () => {
  const { gameState } = useGameProvider()
  return (
    <table>
      <tbody>
        {gameState.gameboard?.map((location) => {
          return BoardLocation(location)
        })}
      </tbody>
    </table>
  )
}

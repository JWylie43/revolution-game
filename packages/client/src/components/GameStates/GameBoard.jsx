import { Button, Grid, GridItem, Text, Box, Flex, Container } from "@chakra-ui/react"
import { socket } from "../../socket"
import { useGameProvider } from "../../providers/GameProvider"
import { useState, useEffect, useRef } from "react"
import { Space } from "react-zoomable-ui"
import "../../app.css"

const InfluenceSpaces = (id, number) => {
  return Array.from({ length: number }, (_, index) => (
    <div key={index} style={{ width: "20px", height: "20px", backgroundColor: "white", margin: "5px" }}></div>
  ))
}

const BoardLocation = ({ id, name, spaces, influence }) => {
  return (
    <tr style={{ width: "fit-content", border: "1px solid black", padding: "10px" }}>
      <td>{name}:</td>
      <td style={{ display: "flex", flexWrap: "wrap" }}>{InfluenceSpaces(id, spaces)}</td>
    </tr>
  )
}

export const GameBoard = () => {
  const { gameState } = useGameProvider()
  return (
    <table>
      <tbody>
        {gameState.gameBoard?.map((location) => {
          return BoardLocation(location)
        })}
      </tbody>
    </table>
  )
}

import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeScript } from "@chakra-ui/color-mode"
import theme from "../theme.js"
import { BrowserRouter } from "react-router-dom"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <App />
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
)

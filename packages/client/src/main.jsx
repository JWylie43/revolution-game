import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import { AccountProvider } from "./providers/AccountProvider.jsx"
import { ToggleColorMode } from "./routes/ToggleColorMode.jsx"
import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeScript } from "@chakra-ui/color-mode"
import theme from "../theme.js"
import { BrowserRouter } from "react-router-dom"

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <AccountProvider>
        <ToggleColorMode />
        <App />
      </AccountProvider>
    </ChakraProvider>
  </BrowserRouter>
)

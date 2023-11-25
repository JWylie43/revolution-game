import { useState } from "react"
import { AccountProvider } from "./providers/AccountProvider"
import { ToggleColorMode } from "./components/ToggleColorMode"
import { Views } from "./components/Views"

export const App = () => {
  return (
    <AccountProvider>
      <Views />
      <ToggleColorMode />
    </AccountProvider>
  )
}

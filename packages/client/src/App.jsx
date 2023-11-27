import { AccountProvider } from "./providers/AccountProvider"
import { ToggleColorMode } from "./components/ToggleColorMode"
import { Authenticate } from "./components/Authenticate"

export const App = () => {
  return (
    <AccountProvider>
      <Authenticate />
      <ToggleColorMode />
    </AccountProvider>
  )
}

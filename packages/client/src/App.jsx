import { AccountProvider } from "./providers/AccountProvider"
import { ToggleColorMode } from "./components/ToggleColorMode"
import { Authenticate } from "./components/Authenticate"
import "./app.css"
export const App = () => {
  return (
    <AccountProvider>
      <Authenticate />
      <ToggleColorMode />
    </AccountProvider>
  )
}

import { AccountProvider } from "./components/AccountContext"
import ToggleColorMode from "./components/ToggleColorMode"
import Views from "./components/Views"

function App() {
  return (
    <AccountProvider>
      <Views />
      <ToggleColorMode />
    </AccountProvider>
  )
}

export default App

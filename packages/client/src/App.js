import ToggleColorMode from "./components/ToggleColorMode"
import Views from "./components/Views"
import { AccountProvider } from "./components/AccountContext"
function App() {
  return (
    <AccountProvider>
      <Views />
      <ToggleColorMode />
    </AccountProvider>
  )
}

export default App

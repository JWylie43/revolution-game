import { IconButton, Text } from "@chakra-ui/react"
import { GiPunch, GiTwoCoins } from "react-icons/gi"
import { MdMailLock } from "react-icons/md"
import { useGameProvider } from "../../providers/GameProvider"
export const BidIcon = (props) => {
  const { socketUser } = useGameProvider()

  const { token, playerBids, setPlayerBids, remainingTokens, setRemainingTokens, space, ...rest } = props
  const icons = { gold: <GiTwoCoins size="2rem" />, blackmail: <MdMailLock size="2rem" />, force: <GiPunch size="2rem" /> }
  return (
    <IconButton
      aria-label={token}
      icon={icons[token]}
      onClick={() => {
        if (remainingTokens[token] === 0) {
          return
        }
        setRemainingTokens((prev) => {
          return { ...prev, [token]: prev[token] - 1 }
        })
        setPlayerBids((prev) => {
          const spaceId = space.id
          const tokenCount = (prev[spaceId]?.[token] ?? 0) + 1
          return {
            ...prev,
            [spaceId]: {
              ...prev[spaceId],
              [token]: tokenCount
            }
          }
        })
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        if (!(playerBids[space.id]?.[token] ?? 0 > 0) || socketUser.bids) {
          return
        }
        setRemainingTokens((prev) => {
          return { ...prev, [token]: prev[token] + 1 }
        })
        setPlayerBids((prev) => {
          const spaceId = space.id
          const tokenCount = (prev[spaceId]?.[token] ?? 0) - 1
          if (tokenCount === 0) {
            if (Object.keys(prev[spaceId]).length === 1) {
              delete prev[spaceId]
              return prev
            } else {
              delete prev[spaceId][token]
              return prev
            }
          }
          return {
            ...prev,
            [spaceId]: {
              ...prev[spaceId],
              [token]: tokenCount
            }
          }
        })
      }}
    />
  )
}

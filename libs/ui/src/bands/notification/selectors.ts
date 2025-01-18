import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"

const useNotifications = () =>
  useSelector((state: RootState) => selectors.selectAll(state))

export { useNotifications }

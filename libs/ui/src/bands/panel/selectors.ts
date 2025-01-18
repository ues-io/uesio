import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"

const usePanel = (panelId: string) =>
  useSelector((state: RootState) => selectors.selectById(state, panelId))

const usePanels = () =>
  useSelector((state: RootState) => selectors.selectAll(state))

export { usePanel, usePanels }

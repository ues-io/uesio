import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"

// Both gets component state and subscribes to component changes
const useView = (viewId: string) =>
	useSelector((state: RootState) => selectors.selectById(state, viewId))

export { useView }

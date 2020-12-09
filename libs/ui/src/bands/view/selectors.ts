import { useSelector } from "react-redux"
import { selectors } from "./adapter"
import RuntimeState from "../../store/types/runtimestate"

// Both gets component state and subscribes to component changes
const useView = (viewId: string) =>
	useSelector((state: RuntimeState) => selectors.selectById(state, viewId))

export { useView }

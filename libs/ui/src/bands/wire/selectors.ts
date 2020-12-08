import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"
import { selectors } from "./adapter"
import { PlainWire } from "./types"

// Both gets wire state and subscribes the component to wire changes
const useWire = (wireName?: string, viewId?: string): PlainWire | undefined =>
	useSelector((state: RuntimeState) => selectWire(state, wireName, viewId))

const selectWire = (state: RuntimeState, wireName?: string, viewId?: string) =>
	selectors.selectById(state, `${viewId}/${wireName}`)

export { useWire, selectWire }

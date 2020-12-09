import { useSelector } from "react-redux"
import RuntimeState from "../../store/types/runtimestate"
import { selectors } from "./adapter"
import { PlainWire } from "./types"

// Both gets wire state and subscribes the component to wire changes
const useWire = (viewId?: string, wireName?: string): PlainWire | undefined =>
	useSelector((state: RuntimeState) => selectWire(state, viewId, wireName))

const selectWire = (state: RuntimeState, viewId?: string, wireName?: string) =>
	viewId && wireName
		? selectors.selectById(state, getFullWireId(viewId, wireName))
		: undefined

const getFullWireId = (viewId: string, wireName: string) =>
	`${viewId}/${wireName}`

export { useWire, selectWire, getFullWireId }

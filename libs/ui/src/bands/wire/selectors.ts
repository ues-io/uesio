import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"
import { PlainWire } from "./types"

// Both gets wire state and subscribes the component to wire changes
const useWire = (viewId?: string, wireName?: string): PlainWire | undefined =>
	useSelector((state: RootState) => selectWire(state, viewId, wireName))

const selectWire = (state: RootState, viewId?: string, wireName?: string) =>
	viewId && wireName
		? selectors.selectById(state, getFullWireId(viewId, wireName))
		: undefined

const getFullWireId = (viewId: string, wireName: string) =>
	`${viewId}/${wireName}`

export { useWire, selectWire, getFullWireId }

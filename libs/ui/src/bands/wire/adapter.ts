import { createEntityAdapter } from "@reduxjs/toolkit"
import RuntimeState from "../../store/types/runtimestate"
import { PlainWire } from "./types"

const wireAdapter = createEntityAdapter<PlainWire>({
	selectId: (wire) => `${wire.view}/${wire.name}`,
})

const selectors = wireAdapter.getSelectors((state: RuntimeState) => state.wire)

export { selectors }

export default wireAdapter

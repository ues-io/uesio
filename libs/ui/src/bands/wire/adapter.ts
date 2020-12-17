import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { PlainWire } from "./types"

const wireAdapter = createEntityAdapter<PlainWire>({
	selectId: (wire) => `${wire.view}/${wire.name}`,
})

const selectors = wireAdapter.getSelectors((state: RootState) => state.wire)

export { selectors }

export default wireAdapter

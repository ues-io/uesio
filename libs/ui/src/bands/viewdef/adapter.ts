import { createEntityAdapter } from "@reduxjs/toolkit"
import RuntimeState from "../../store/types/runtimestate"
import { PlainViewDef } from "./types"

const viewdefAdapter = createEntityAdapter<PlainViewDef>({
	selectId: (viewdef) => `${viewdef.namespace}.${viewdef.name}`,
})

const selectors = viewdefAdapter.getSelectors(
	(state: RuntimeState) => state.viewdef
)

export { selectors }

export default viewdefAdapter

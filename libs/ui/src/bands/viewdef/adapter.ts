import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { PlainViewDef } from "./types"

const viewdefAdapter = createEntityAdapter<PlainViewDef>({
	selectId: (viewdef) => `${viewdef.namespace}.${viewdef.name}`,
})

const selectors = viewdefAdapter.getSelectors(
	(state: RootState) => state.viewdef
)

export { selectors }

export default viewdefAdapter

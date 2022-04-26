import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { PlainView } from "./types"

const viewAdapter = createEntityAdapter<PlainView>({
	selectId: (view) => `${view.viewDefId}(${view.path})`,
})

const selectors = viewAdapter.getSelectors((state: RootState) => state.view)

export { selectors }

export default viewAdapter

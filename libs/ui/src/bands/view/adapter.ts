import { createEntityAdapter } from "@reduxjs/toolkit"
import RuntimeState from "../../store/types/runtimestate"
import { PlainView } from "./types"

const viewAdapter = createEntityAdapter<PlainView>({
	selectId: (view) => `${view.namespace}.${view.name}(${view.path})`,
})

const selectors = viewAdapter.getSelectors((state: RuntimeState) => state.view)

export { selectors }

export default viewAdapter

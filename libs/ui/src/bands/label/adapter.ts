import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { Label } from "./types"

export const labelAdapter = createEntityAdapter<Label>({
	selectId: ({ name, namespace }) => `${namespace}.${name}`,
})

export const { selectById, selectEntities } = labelAdapter.getSelectors(
	(state: RootState) => state.label
)

const selectors = labelAdapter.getSelectors((state: RootState) => state.label)

export { selectors }

export default labelAdapter

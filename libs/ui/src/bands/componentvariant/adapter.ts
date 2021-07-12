import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"

export const componentVariantAdapter = createEntityAdapter({
	selectId: ({ component, name }) => `${component}.${name}`,
})

export const { selectAll, selectById } = componentVariantAdapter.getSelectors(
	(state: RootState) => state.componentVariant
)

export default componentVariantAdapter

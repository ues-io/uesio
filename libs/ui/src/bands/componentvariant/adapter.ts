import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"

export const componentVariantAdapter = createEntityAdapter({
	selectId: ({ component, namespace, name }) =>
		`${component}.${namespace}.${name}`,
})

export const { selectAll, selectById } = componentVariantAdapter.getSelectors(
	(state: RootState) => state.componentvariant
)

export default componentVariantAdapter

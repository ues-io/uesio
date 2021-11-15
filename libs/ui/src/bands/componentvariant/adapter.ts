import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentVariant } from "./types"

const componenetVariantAdapter = createEntityAdapter<ComponentVariant>({
	selectId: (componentvariant) => `${componentvariant.name}`,
})

export const { selectById, selectEntities } =
	componenetVariantAdapter.getSelectors(
		(state: RootState) => state.componentvariant
	)

const selectors = componenetVariantAdapter.getSelectors(
	(state: RootState) => state.componentvariant
)

export { selectors }

export default componenetVariantAdapter

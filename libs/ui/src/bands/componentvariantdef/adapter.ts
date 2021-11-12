import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentVariantDef } from "./types"

const componenetVariantDefAdapter = createEntityAdapter<ComponentVariantDef>({
	selectId: (componentvariantdef) => `${componentvariantdef.name}`,
})

export const { selectById, selectEntities } =
	componenetVariantDefAdapter.getSelectors(
		(state: RootState) => state.componentvariantdef
	)

const selectors = componenetVariantDefAdapter.getSelectors(
	(state: RootState) => state.componentvariantdef
)

export { selectors }

export default componenetVariantDefAdapter

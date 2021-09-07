import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentVariant } from "./types"

export const componentVariantAdapter = createEntityAdapter<ComponentVariant>({
	selectId: ({ component, namespace, name }) =>
		`${component}.${namespace}.${name}`,
})

export const { selectById, selectEntities } =
	componentVariantAdapter.getSelectors(
		(state: RootState) => state.componentvariant
	)

export default componentVariantAdapter

import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { Component } from "./types"
import { getKey } from "../../metadata/metadata"

const componentTypeAdapter = createEntityAdapter<Component>({
	selectId: getKey,
})

const selectors = componentTypeAdapter.getSelectors(
	(state: RootState) => state.componenttype
)

export { selectors }

export default componentTypeAdapter

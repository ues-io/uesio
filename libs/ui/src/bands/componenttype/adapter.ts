import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { Component } from "./types"
import { getKey } from "../../metadata/metadata"

const componentTypeAdapter = createEntityAdapter({
	selectId: getKey<Component>,
})

const selectors = componentTypeAdapter.getSelectors<RootState>(
	(state) => state.componenttype
)

export { selectors }

export default componentTypeAdapter

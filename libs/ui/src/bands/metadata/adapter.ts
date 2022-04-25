import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { MetadataState } from "./types"

const metadataAdapter = createEntityAdapter<MetadataState>({
	selectId: (metadata) => `${metadata.type}:${metadata.key}`,
})

const selectors = metadataAdapter.getSelectors(
	(state: RootState) => state.metadata
)

export { selectors }

export default metadataAdapter

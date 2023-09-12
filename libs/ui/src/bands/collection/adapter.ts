import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { PlainCollection } from "./types"
import { getKey } from "../../metadata/metadata"

const collectionAdapter = createEntityAdapter<PlainCollection>({
	selectId: getKey,
})

const selectors = collectionAdapter.getSelectors(
	(state: RootState) => state.collection
)

export { selectors }

export default collectionAdapter

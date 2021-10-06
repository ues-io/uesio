import { createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { PlainCollection } from "./types"

const collectionAdapter = createEntityAdapter<PlainCollection>({
	selectId: (collection) => `${collection.namespace}.${collection.name}`,
})

const selectors = collectionAdapter.getSelectors(
	(state: RootState) => state.collection
)

export { selectors }

export default collectionAdapter

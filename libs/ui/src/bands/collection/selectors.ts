import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { selectors } from "./adapter"
import { PlainCollection } from "./types"

const useCollection = (collectionId: string | undefined) =>
	useSelector((state: RootState) =>
		collectionId ? selectors.selectById(state, collectionId) : undefined
	)
const useCollections = (
	collectionIds: string[]
): Record<string, PlainCollection | undefined> =>
	Object.fromEntries(
		Object.entries(useSelector(selectors.selectEntities)).filter(([key]) =>
			collectionIds.includes(key)
		)
	)

export { useCollection, useCollections }

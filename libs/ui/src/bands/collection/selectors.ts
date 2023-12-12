import { useSelector } from "react-redux"
import { getCurrentState, RootState } from "../../store/store"

import { PlainCollection } from "./types"
import { selectors } from "."

const useCollection = (collectionId: string | undefined) =>
	useSelector((state: RootState) =>
		collectionId ? selectors.selectById(state, collectionId) : undefined
	)
const getCollection = (collectionId: string | undefined) =>
	collectionId
		? selectors.selectById(getCurrentState(), collectionId)
		: undefined
const useCollections = (
	collectionIds: string[]
): Record<string, PlainCollection | undefined> =>
	Object.fromEntries(
		Object.entries(useSelector(selectors.selectEntities)).filter(([key]) =>
			collectionIds.includes(key)
		)
	)

const useCollectionKeys = () => useSelector(selectors.selectIds) as string[]

export { useCollection, useCollections, getCollection, useCollectionKeys }

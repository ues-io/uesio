import {
	useCollection as useColl,
	getCollection as getColl,
	useCollectionKeys,
} from "../bands/collection/selectors"
import { Context } from "../context/context"
import getMetadata from "../bands/collection/operations/get"
import { platform } from "../platform/platform"
import Collection from "../bands/collection/class"
import { useEffect, useMemo } from "react"

type UseCollectionOptions = {
	needAllFieldMetadata?: boolean
}

const useCollection = (
	context: Context,
	collectionName: string,
	options?: UseCollectionOptions
) => {
	const plainCollection = useColl(collectionName)
	const contextMemo = useMemo(() => context, [context])

	useEffect(() => {
		if (
			!plainCollection ||
			(!plainCollection.hasAllFields && options?.needAllFieldMetadata)
		) {
			getMetadata(collectionName, contextMemo)
		}
	}, [
		collectionName,
		options?.needAllFieldMetadata,
		plainCollection,
		contextMemo,
	])

	return useMemo(
		() => (plainCollection ? new Collection(plainCollection) : undefined),
		[plainCollection]
	)
}

const getCollection = (collectionName: string) => {
	const plainCollection = getColl(collectionName)
	return plainCollection && new Collection(plainCollection)
}

const createJob = platform.createJob
const importData = platform.importData

export {
	useCollection,
	getCollection,
	createJob,
	importData,
	useCollectionKeys,
}

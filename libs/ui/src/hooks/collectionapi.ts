import {
	useCollection as useColl,
	getCollection as getColl,
} from "../bands/collection/selectors"
import { Context } from "../context/context"

import { useEffect } from "react"
import getMetadata from "../bands/collection/operations/get"
import { platform } from "../platform/platform"
import Collection from "../bands/collection/class"

type UseCollectionOptions = {
	needAllFieldMetadata?: boolean
}

const useCollection = (
	context: Context,
	collectionName: string,
	options?: UseCollectionOptions
) => {
	const plainCollection = useColl(collectionName)

	useEffect(() => {
		if (
			!plainCollection ||
			(!plainCollection.hasAllFields && options?.needAllFieldMetadata)
		) {
			getMetadata(collectionName, context)
		}
	}, [])

	return plainCollection && new Collection(plainCollection)
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
	UseCollectionOptions,
}

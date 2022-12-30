import { useCollection as useColl } from "../bands/collection/selectors"
import { Context } from "../context/context"

import { useEffect } from "react"
import getMetadata from "../bands/collection/operations/get"
import { platform } from "../platform/platform"
import Collection from "../bands/collection/class"

const useCollection = (context: Context, collectionName: string) => {
	const plainCollection = useColl(collectionName)

	useEffect(() => {
		if (!plainCollection) {
			getMetadata(collectionName, context)
		}
	}, [])

	return plainCollection && new Collection(plainCollection)
}

const createJob = platform.createJob
const importData = platform.importData

export { useCollection, createJob, importData }

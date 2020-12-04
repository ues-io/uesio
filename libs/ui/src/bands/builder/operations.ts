import { metadata } from "@uesio/constants"
import { AnyAction } from "redux"
import { setAvailableNamespaces, setMetadataList } from "."
import { Context } from "../../context/context"
import { Platform } from "../../platform/platform"
import { Dispatcher } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"

const getMetadataList = (
	context: Context,
	metadataType: metadata.MetadataType,
	namespace: string,
	grouping?: string
) => {
	return async (
		dispatch: Dispatcher<AnyAction>,
		getState: () => RuntimeState,
		platform: Platform
	) => {
		const metadata = await platform.getMetadataList(
			context,
			metadataType,
			namespace,
			grouping
		)
		dispatch(
			setMetadataList({
				metadataType,
				namespace,
				grouping,
				metadata,
			})
		)
		return context
	}
}

const getAvailableNamespaces = (context: Context) => {
	return async (
		dispatch: Dispatcher<AnyAction>,
		getState: () => RuntimeState,
		platform: Platform
	) => {
		const namespaces = await platform.getAvailableNamespaces(context)
		dispatch(setAvailableNamespaces(namespaces))
		return context
	}
}

export default { getMetadataList, getAvailableNamespaces }

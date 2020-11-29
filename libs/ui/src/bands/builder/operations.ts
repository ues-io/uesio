import { AnyAction } from "redux"
import { setAvailableNamespaces, setMetadataList } from "."
import { Context } from "../../context/context"
import { Platform } from "../../platform/platform"
import { Dispatcher, DispatchReturn, ThunkFunc } from "../../store/store"
import RuntimeState from "../../store/types/runtimestate"
import { GetAvailableNamespacesSignal, GetMetadataListSignal } from "./types"

const getMetadataList = (
	signal: GetMetadataListSignal,
	context: Context
): ThunkFunc => {
	return async (
		dispatch: Dispatcher<AnyAction>,
		getState: () => RuntimeState,
		platform: Platform
	): DispatchReturn => {
		const { metadataType, namespace, grouping } = signal
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

const getAvailableNamespaces = (
	signal: GetAvailableNamespacesSignal,
	context: Context
): ThunkFunc => {
	return async (
		dispatch: Dispatcher<AnyAction>,
		getState: () => RuntimeState,
		platform: Platform
	): DispatchReturn => {
		const namespaces = await platform.getAvailableNamespaces(context)
		dispatch(setAvailableNamespaces(namespaces))
		return context
	}
}

export default { getMetadataList, getAvailableNamespaces }

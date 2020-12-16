import { metadata } from "@uesio/constants"
import { setAvailableNamespaces, setMetadataList } from "."
import { Context } from "../../context/context"
import { ThunkFunc } from "../../store/store"

const getMetadataList = (
	context: Context,
	metadataType: metadata.MetadataType,
	namespace: string,
	grouping?: string
): ThunkFunc => async (dispatch, getState, platform) => {
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

const getAvailableNamespaces = (context: Context): ThunkFunc => async (
	dispatch,
	getState,
	platform
) => {
	const namespaces = await platform.getAvailableNamespaces(context)
	dispatch(setAvailableNamespaces(namespaces))
	return context
}

export default { getMetadataList, getAvailableNamespaces }

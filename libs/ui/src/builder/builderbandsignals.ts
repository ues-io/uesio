import { BandSignal } from "../definition/signal"
import { MetadataType } from "../buildmode/buildpropdefinition"

const GET_METADATA_LIST = "GET_METADATA_LIST"
const GET_AVAILABLE_NAMESPACES = "GET_AVAILABLE_NAMESPACES"

interface GetMetadataListSignal extends BandSignal {
	signal: typeof GET_METADATA_LIST
	metadataType: MetadataType
	namespace: string
	grouping?: string
}

interface GetAvailableNamespacesSignal extends BandSignal {
	signal: typeof GET_AVAILABLE_NAMESPACES
}

type BuilderBandSignal = GetMetadataListSignal | GetAvailableNamespacesSignal

export {
	GetMetadataListSignal,
	GetAvailableNamespacesSignal,
	GET_METADATA_LIST,
	GET_AVAILABLE_NAMESPACES,
	BuilderBandSignal,
}

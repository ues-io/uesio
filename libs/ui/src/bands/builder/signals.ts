import { SignalDefinition } from "../../definition/signal"
import { BuilderSignal } from "./types"
import operations from "./operations"
import { metadata } from "@uesio/constants"

// The key for the entire band
const BUILDER_BAND = "builder"

// The keys for all signals in the band
const GET_METADATA_LIST = "GET_METADATA_LIST"
const GET_AVAILABLE_NAMESPACES = "GET_AVAILABLE_NAMESPACES"

// "Signal Creators" for all of the signals in the band
const getMetadataListSignal = (
	metadataType: metadata.MetadataType,
	namespace: string,
	grouping?: string
) => ({
	signal: GET_METADATA_LIST as typeof GET_METADATA_LIST,
	band: BUILDER_BAND as typeof BUILDER_BAND,
	metadataType,
	namespace,
	grouping,
})

const getAvailableNamespacesSignal = () => ({
	signal: GET_AVAILABLE_NAMESPACES as typeof GET_AVAILABLE_NAMESPACES,
	band: BUILDER_BAND as typeof BUILDER_BAND,
})

// "Signal Handlers" for all of the signals in the band
const handlers = {
	[GET_METADATA_LIST]: {
		dispatcher: operations.getMetadataList,
	},
	[GET_AVAILABLE_NAMESPACES]: {
		dispatcher: operations.getAvailableNamespaces,
	},
}

// A map of all of the handlers in the bot band and a function that
// can narrow the type of a signal down to a specific signal
const registry = {
	handlers,
	validateSignal: (signal: SignalDefinition): signal is BuilderSignal =>
		signal.signal in registry.handlers,
}

export { getMetadataListSignal, getAvailableNamespacesSignal, registry }

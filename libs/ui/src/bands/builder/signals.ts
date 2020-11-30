import operations from "./operations"
import { metadata } from "@uesio/constants"

// The key for the entire band
const BUILDER_BAND = "builder"

// The keys for all signals in the band
const GET_METADATA_LIST = `${BUILDER_BAND}/GET_METADATA_LIST`
const GET_AVAILABLE_NAMESPACES = `${BUILDER_BAND}/GET_AVAILABLE_NAMESPACES`

// "Signal Creators" for all of the signals in the band
const getMetadataListCreator = (
	metadataType: metadata.MetadataType,
	namespace: string,
	grouping?: string
) => ({
	signal: GET_METADATA_LIST,
	band: "", //TODO: remove this
	metadataType,
	namespace,
	grouping,
})

const getAvailableNamespacesCreator = () => ({
	signal: GET_AVAILABLE_NAMESPACES,
	band: "", //TODO: remove this
})

const signals = [
	{
		key: GET_METADATA_LIST,
		dispatcher: operations.getMetadataList,
	},
	{
		key: GET_AVAILABLE_NAMESPACES,
		dispatcher: operations.getAvailableNamespaces,
	},
]

export { getMetadataListCreator, getAvailableNamespacesCreator }
export default signals

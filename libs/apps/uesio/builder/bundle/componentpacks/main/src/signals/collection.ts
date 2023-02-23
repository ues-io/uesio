import { SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const COLLECTION_BAND = "collection"

// Metadata for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${COLLECTION_BAND}/CREATE_JOB`]: {
		label: "Create Export Job",
		description: "Create Export Job for a collection",
		properties: () => [
			{
				type: "METADATA",
				name: "collection",
				label: "Collection",
				metadataType: "COLLECTION",
			},
		],
	},
}

export default signals

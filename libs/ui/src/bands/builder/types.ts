import { metadata } from "@uesio/constants"

type MetadataListStore = {
	[key: string]: MetadataListStore | null
} | null

type BuilderState = {
	activeNode?: string
	selectedNode?: string
	buildMode: boolean
	draggingNode?: string
	droppingNode?: string
	lastModifiedNode?: string
	buildView?: string
	rightPanel?: string
	leftPanel?: string
	metadata: MetadataListStore
	namespaces: MetadataListStore
}

type MetadataListResponse = {
	metadataType: metadata.MetadataType
	namespace: string
	grouping?: string
	metadata: MetadataListStore
}

export { BuilderState, MetadataListStore, MetadataListResponse }

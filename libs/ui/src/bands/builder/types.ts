import { metadata } from "@uesio/constants"
import {
	getAvailableNamespacesCreator,
	getMetadataListCreator,
} from "./signals"

type MetadataListStore = {
	[key: string]: MetadataListStore | null
} | null

type BuilderState = {
	activeNode?: string
	selectedNode?: string
	buildMode: boolean
	draggingNode?: string
	droppingNode?: string
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

type GetMetadataListSignal = ReturnType<typeof getMetadataListCreator>
type GetAvailableNamespacesSignal = ReturnType<
	typeof getAvailableNamespacesCreator
>

export {
	BuilderState,
	MetadataListStore,
	MetadataListResponse,
	GetMetadataListSignal,
	GetAvailableNamespacesSignal,
}

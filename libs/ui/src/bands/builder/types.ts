import { metadata } from "@uesio/constants"
import { getAvailableNamespacesSignal, getMetadataListSignal } from "./signals"

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

type GetMetadataListSignal = ReturnType<typeof getMetadataListSignal>
type GetAvailableNamespacesSignal = ReturnType<
	typeof getAvailableNamespacesSignal
>

// A type that describes all signals in the bot band
type BuilderSignal = GetMetadataListSignal | GetAvailableNamespacesSignal

export {
	BuilderState,
	MetadataListStore,
	MetadataListResponse,
	BuilderSignal,
	GetMetadataListSignal,
	GetAvailableNamespacesSignal,
}

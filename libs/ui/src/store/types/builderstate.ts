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
export { MetadataListStore }

export default BuilderState

import { definition, api, metadata, context as ctx } from "@uesio/ui"

type ComponentDef = {
	name: string
	namespace: string
	title: string
	description: string
	category: string
	discoverable: boolean
}

class FullPath {
	constructor(itemType?: string, itemName?: string, localPath?: string) {
		this.itemType = itemType || ""
		this.itemName = itemName || ""
		this.localPath = localPath || ""
	}

	itemType: string
	itemName: string
	localPath: string

	combine = () => [this.itemType, this.itemName, this.localPath].join(":")

	pathCombine = () =>
		`["${this.itemType}"]["${this.itemName}"]${this.localPath}`

	equals = (path: FullPath) =>
		this.itemType === path.itemType &&
		this.itemName === path.itemName &&
		this.localPath === path.localPath

	startsWith = (path: FullPath) =>
		this.itemType === path.itemType &&
		this.itemName === path.itemName &&
		this.localPath.startsWith(path.localPath)

	setLocal = (localPath: string) =>
		new FullPath(this.itemType, this.itemName, localPath)

	addLocal = (localPath: string) =>
		new FullPath(this.itemType, this.itemName, this.localPath + localPath)
}

const parseFullPath = (fullPath: string | undefined) => {
	const [itemType, itemName, localPath] = (fullPath || "").split(":")
	return new FullPath(itemType, itemName, localPath)
}

const getBuilderComponentId = (context: ctx.Context, id: string) =>
	api.component.makeComponentId(context, "uesio/builder.mainwrapper", id)

const getBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string
) => api.component.getExternalState<T>(getBuilderComponentId(context, id))

const useBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string,
	initialState?: T
) => api.component.useState<T>(getBuilderComponentId(context, id), initialState)

const getBuilderNamespaces = (context: ctx.Context) =>
	getBuilderState<Record<string, metadata.MetadataInfo>>(
		context,
		"namespaces"
	) || {}

const getBuildMode = (context: ctx.Context) =>
	getBuilderState<boolean>(context, "buildmode") || false

const useBuildMode = (context: ctx.Context) =>
	useBuilderState<boolean>(context, "buildmode") || false

type PathSelector = (path?: FullPath) => void

const getFullPathPair = (
	fullPath: string | undefined,
	setter: (fullPath: string) => void
): [FullPath, PathSelector] => [
	parseFullPath(fullPath),
	(path?: FullPath) => {
		if (!path) {
			setter("::")
			return
		}
		setter(path?.combine())
	},
]

const useSelectedPath = (context: ctx.Context): [FullPath, PathSelector] => {
	const [fullPath, set] = useBuilderState<string>(context, "selected")
	const [parsedPath, wrappedSet] = getFullPathPair(fullPath, set)
	if (!parsedPath.itemType) parsedPath.itemType = "viewdef"
	if (parsedPath.itemType === "viewdef" && !parsedPath.itemName)
		parsedPath.itemName = context.getViewDefId() || ""
	return [parsedPath, wrappedSet]
}

const useDropPath = (context: ctx.Context): [FullPath, PathSelector] => {
	const [fullPath, set] = useBuilderState<string>(context, "drop")
	return getFullPathPair(fullPath, set)
}

const useDragPath = (context: ctx.Context): [FullPath, PathSelector] => {
	const [fullPath, set] = useBuilderState<string>(context, "drag")
	return getFullPathPair(fullPath, set)
}

const getComponentDefs = (context: ctx.Context) =>
	getBuilderState<Record<string, ComponentDef>>(context, "componentdefs")

const getComponentDef = (
	context: ctx.Context,
	componentType: string | undefined
) => (componentType ? getComponentDefs(context)?.[componentType] : undefined)

export {
	getBuildMode,
	useBuildMode,
	useDropPath,
	useDragPath,
	getBuilderNamespaces,
	getBuilderState,
	getComponentDefs,
	getComponentDef,
	useBuilderState,
	useSelectedPath,
	ComponentDef,
	PathSelector,
	FullPath,
}

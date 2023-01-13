import { definition, api, metadata, context as ctx } from "@uesio/ui"
import { FullPath, getFullPathPair, PathSelector } from "./path"

type ComponentDef = {
	name: string
	namespace: string
	title: string
	description: string
	category: string
	discoverable: boolean
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
}

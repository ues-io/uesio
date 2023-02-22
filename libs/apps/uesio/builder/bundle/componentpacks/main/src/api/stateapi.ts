import { api, component, context as ctx, definition, metadata } from "@uesio/ui"
import { combinePath, FullPath, parseFullPath } from "./path"
import { PropertiesPanelSection } from "./propertysection"
import { SignalDescriptor } from "./signalsapi"

type ComponentDef = {
	name: string
	namespace: string
	title: string
	description: string
	category: string
	discoverable: boolean
	properties?: component.ComponentProperty[]
	sections?: PropertiesPanelSection[]
	defaultDefinition?: definition.DefinitionMap
	signals?: Record<string, SignalDescriptor>
}

const getBuilderComponentId = (context: ctx.Context, id: string) =>
	api.component.makeComponentId(
		context.getRouteContext(),
		"uesio/builder.mainwrapper",
		id,
		true
	)

const getBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string
) => api.component.getExternalState<T>(getBuilderComponentId(context, id))

const useBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string,
	initialState?: T
) => api.component.useState<T>(getBuilderComponentId(context, id), initialState)

const useBuilderExternalState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string
) => api.component.useExternalState<T>(getBuilderComponentId(context, id))

const getBuilderExternalState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string
) => api.component.getExternalState<T>(getBuilderComponentId(context, id))

const setBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string,
	state: T
) => api.component.setState<T>(getBuilderComponentId(context, id), state)

const getBuilderNamespaces = (context: ctx.Context) =>
	getBuilderState<Record<string, metadata.NamespaceInfo>>(
		context,
		"namespaces"
	) || {}

const getBuilderNamespace = (
	context: ctx.Context,
	key: metadata.MetadataKey
) => {
	const namespaces = getBuilderNamespaces(context)
	if (!key) return undefined
	const [ns] = key.split(".")
	return namespaces[ns]
}

const getBuildMode = (context: ctx.Context) =>
	getBuilderState<boolean>(context, "buildmode") || false

const useBuildMode = (context: ctx.Context) =>
	useBuilderState<boolean>(context, "buildmode") || false

const useSelectedPath = (context: ctx.Context) =>
	parseFullPath(useBuilderExternalState<string>(context, "selected"))

const useSelectedViewPath = (context: ctx.Context) => {
	const fullPath = useBuilderExternalState<string>(context, "selected")
	const parsedPath = parseFullPath(fullPath)
	if (parsedPath.itemType === "viewdef") return parsedPath
	return new FullPath("viewdef", context.getViewDefId(), "")
}

const getSelectedViewPath = (context: ctx.Context) => {
	const fullPath = getBuilderExternalState<string>(context, "selected")
	const parsedPath = parseFullPath(fullPath)
	if (parsedPath.itemType === "viewdef") return parsedPath
	return new FullPath("viewdef", context.getViewDefId(), "")
}

const setSelectedPath = (context: ctx.Context, path?: FullPath) => {
	// If the selected path is a panel, make sure it's opened
	if (path) {
		const pathArray = component.path.toPath(path.localPath)
		const isPanel = path.itemType === "viewdef" && pathArray[0] === "panels"
		if (isPanel) {
			const panelId = pathArray[1]
			api.signal.run(
				{
					signal: "panel/CLOSE_ALL",
				},
				context
			)
			api.signal.run(
				{
					signal: "panel/OPEN",
					panel: panelId,
				},
				context
			)
		}
	}

	setBuilderState<string>(context, "selected", combinePath(path))
}

const getSelectedPath = (context: ctx.Context) =>
	parseFullPath(getBuilderExternalState<string>(context, "selected"))

const useDropPath = (context: ctx.Context) =>
	parseFullPath(useBuilderExternalState<string>(context, "drop"))

const setDropPath = (context: ctx.Context, path?: FullPath) => {
	setBuilderState<string>(context, "drop", combinePath(path))
}

const useDragPath = (context: ctx.Context) =>
	parseFullPath(useBuilderExternalState<string>(context, "drag"))

const setDragPath = (context: ctx.Context, path?: FullPath) => {
	setBuilderState<string>(context, "drag", combinePath(path))
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
	setDropPath,
	useDragPath,
	setDragPath,
	getBuilderNamespaces,
	getBuilderNamespace,
	getBuilderState,
	getComponentDefs,
	getComponentDef,
	useBuilderState,
	useSelectedPath,
	getSelectedPath,
	setSelectedPath,
	useSelectedViewPath,
	getSelectedViewPath,
	ComponentDef,
}

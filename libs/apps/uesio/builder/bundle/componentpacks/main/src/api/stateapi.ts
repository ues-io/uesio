import { definition, api, metadata, context as ctx } from "@uesio/ui"

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

const useSelectedPath = (context: ctx.Context) =>
	useBuilderState<string>(context, "selected")

const isSelected = (selectedPath: string | undefined, checkPath: string) =>
	selectedPath === checkPath

const isInSelection = (selectedPath: string | undefined, checkPath: string) =>
	selectedPath && selectedPath.startsWith(checkPath)

export {
	getBuildMode,
	useBuildMode,
	getBuilderNamespaces,
	useBuilderState,
	useSelectedPath,
	isSelected,
	isInSelection,
}

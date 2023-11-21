import { api, component, context as ctx, definition, metadata } from "@uesio/ui"
import { ComponentProperty } from "../properties/componentproperty"
import { combinePath, FullPath, parseFullPath } from "./path"
import { PropertiesPanelSection } from "./propertysection"
import { SignalDescriptor } from "./signalsapi"
import { get, getMetadataId, useDefinition } from "./defapi"
import pointer from "json-pointer"
const { COMPONENT_ID } = component
const {
	getAllComponentTypes,
	getComponentType,
	getExternalState,
	getExternalStates,
	removeState,
	setState,
	useExternalState,
	useExternalStates,
	useExternalStatesCount,
	useState,
} = api.component

interface WireContextProvision {
	type: "WIRE"
	wireProperty: string
}

interface RecordContextProvision {
	type: "RECORD"
	wireProperty: string
}

interface FieldModeContextProvision {
	type: "FIELD_MODE"
	modeProperty: string
}

type SlotContextProvision =
	| WireContextProvision
	| RecordContextProvision
	| FieldModeContextProvision

type SlotDef = {
	name: string
	path?: string
	providesContexts?: SlotContextProvision[]
	defaultContent?: definition.DefinitionList
}

type StyleRegion = {
	widgets?: string[]
}

// Builder-only component definition properties.
// These additional properties will only be populated in build mode.
type ComponentDef = {
	title: string
	description: string
	category: string
	discoverable: boolean
	icon?: string
	slots?: SlotDef[]
	properties?: ComponentProperty[]
	sections?: PropertiesPanelSection[]
	defaultDefinition?: definition.DefinitionMap
	signals?: Record<string, SignalDescriptor>
	styleRegions?: Record<string, StyleRegion>
} & component.ComponentDef

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
) => getExternalState<T>(getBuilderComponentId(context, id))

const useBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string,
	initialState?: T
) => useState<T>(getBuilderComponentId(context, id), initialState)

const useViewValidationState = (path: FullPath) =>
	useState<boolean>(`viewValidation:${getMetadataId(path)}`)
const useLastValidViewDefinition = (path: FullPath) =>
	useState<component.ViewComponentDefinition>(
		`lastValidView:${getMetadataId(path)}`
	)

const useBuilderExternalState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string
) => useExternalState<T>(getBuilderComponentId(context, id))

const useBuilderExternalStates = (context: ctx.Context, id: string) =>
	useExternalStates(getBuilderComponentId(context, id))

const useBuilderExternalStatesCount = (context: ctx.Context, id: string) =>
	useExternalStatesCount(getBuilderComponentId(context, id))

const getBuilderExternalState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string
) => getExternalState<T>(getBuilderComponentId(context, id))

const getBuilderExternalStates = (context: ctx.Context, id: string) =>
	getExternalStates(getBuilderComponentId(context, id))

const removeBuilderState = (context: ctx.Context, id: string) =>
	removeState(getBuilderComponentId(context, id))

const setBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string,
	state: T
) => setState<T>(getBuilderComponentId(context, id), state)

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

// This gets the normalized path of the selected component.
// Even if the selected path includes a property of that component,
// we ignore it.
const useSelectedComponentPath = (context: ctx.Context) => {
	const selectedPath = useSelectedPath(context)
	const selectedDef = useDefinition(context, selectedPath)
	return getSelectedComponentPath(selectedPath, selectedDef)
}

const getSelectedComponentPath = (
	selectedPath: FullPath,
	selectedDef: unknown
) => {
	const [key] = selectedPath.pop()

	let path = selectedPath

	// If our topmost key was an index we need to get the next one
	// from the definition
	if (component.path.isNumberIndex(key) && selectedDef) {
		path = selectedPath.addLocal(Object.keys(selectedDef)[0])
	}
	// Trim our path down to our nearest component
	return path.trim()
}

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
const getComponentDefs = () => getAllComponentTypes() as ComponentDef[]

const getComponentDef = (componentType: string | undefined) =>
	componentType
		? (getComponentType(componentType) as ComponentDef)
		: undefined

type ViewDef = {
	components: ComponentEntry[]
	panels?: Record<string, object>
}

// For each component of the requested type in the context view definition
// which has a "uesio.id" property, return the value of that property.
const getComponentIdsOfType = (
	context: ctx.Context,
	componentType: string | undefined
) => {
	// Traverse the view def tree to extract all Component Ids of the given type,
	// using "uesio.id" as the unique key
	const componentIds = [] as string[]
	if (componentType) {
		walkViewComponents(context, (type, definition) => {
			const { [COMPONENT_ID]: id } = definition
			if (type === componentType && id) {
				componentIds.push(id as string)
			}
			return true
		})
	}
	return componentIds
}
// Find a Component definition by its uesio unique id
const getComponentById = (context: ctx.Context, componentId: string) => {
	let targetComponentDef: definition.BaseDefinition | undefined
	walkViewComponents(context, (_, definition) => {
		const { [COMPONENT_ID]: id } = definition
		if (id === componentId) {
			targetComponentDef = definition
			return false
		}
		return true
	})
	return targetComponentDef
}

type ComponentEntry = Record<string, definition.BaseDefinition>
type PanelDef = {
	components?: ComponentEntry[]
	actions?: ComponentEntry[]
} & definition.BaseDefinition

// A generic tree walker for all components in the context view definition.
// Visits each component in the components array and in each panel's components,
// and uses each component's slot metadata to visit any components in each slot.
// If visit returns false, the walk is immediately terminated.
const walkViewComponents = (
	context: ctx.Context,
	visit: (
		componentType: string,
		definition: definition.BaseDefinition
	) => boolean
) => {
	const viewPath = new FullPath("viewdef", context.getViewDefId(), "")
	const viewDef = get(context, viewPath) as ViewDef
	// Start traversing!
	if (viewDef?.components?.length) {
		const keepWalking = walkComponentsArray(
			viewDef.components,
			context,
			visit
		)
		if (!keepWalking) {
			return
		}
	}
	// Traverse panel components and actions, if there are any
	if (viewDef?.panels) {
		for (const panel of Object.values(viewDef.panels) as PanelDef[]) {
			if (panel?.components?.length) {
				const keepWalking = walkComponentsArray(
					panel.components,
					context,
					visit
				)
				if (!keepWalking) {
					return
				}
			}
			if (panel?.actions?.length) {
				const keepWalking = walkComponentsArray(
					panel.actions,
					context,
					visit
				)
				if (!keepWalking) {
					return
				}
			}
		}
	}
}

// Internal function that visits each in the given components array
const walkComponentsArray = (
	components: ComponentEntry[],
	context: ctx.Context,
	visit: (
		componentType: string,
		definition: definition.BaseDefinition
	) => boolean
): boolean => {
	for (const component of components) {
		// If this is truly a Uesio component, it will look like this:
		// { <componentType>: { <definition> }}
		if (typeof component !== "object") continue
		const keys = Object.keys(component)
		if (keys.length !== 1) continue
		const componentType = keys[0] as string
		const props = component[componentType]
		// Visit this component
		const keepWalking = visit(componentType, props)
		if (!keepWalking) return false
		// Next, check if this component type has slots, in which case we need to traverse the slots
		const componentDef = getComponentDef(componentType)
		if (!componentDef?.slots?.length) continue
		// Okay we have slots, so we need to traverse and recurse
		for (const slot of componentDef.slots) {
			// If there is not a path, then use name as path
			const { path = slot.name } = slot
			if (!path) continue
			let slotComponents: ComponentEntry[] | undefined
			try {
				slotComponents = pointer.get(
					props,
					path.startsWith("/") ? path : `/${path}`
				) as ComponentEntry[]
			} catch (e) {
				// eslint-disable-next-line no-empty
			}
			if (!slotComponents?.length) continue
			const keepWalking = walkComponentsArray(
				slotComponents,
				context,
				visit
			)
			if (!keepWalking) return false
		}
	}
	return true
}

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
	getComponentById,
	getComponentDefs,
	getComponentDef,
	getComponentIdsOfType,
	useBuilderState,
	useBuilderExternalState,
	useBuilderExternalStates,
	useBuilderExternalStatesCount,
	getBuilderExternalState,
	getBuilderExternalStates,
	setBuilderState,
	removeBuilderState,
	useSelectedPath,
	getSelectedPath,
	setSelectedPath,
	useSelectedComponentPath,
	getSelectedComponentPath,
	useSelectedViewPath,
	getSelectedViewPath,
	walkViewComponents,
	useViewValidationState,
	useLastValidViewDefinition,
}

export type { ComponentDef, SlotDef }

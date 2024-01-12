import {
	api,
	component,
	context as ctx,
	definition,
	metadata,
	signal,
	styles,
	wire,
} from "@uesio/ui"
import { ComponentProperty } from "../properties/componentproperty"
import { combinePath, FullPath, parseFullPath } from "./path"
import { PropertiesPanelSection } from "./propertysection"
import { SignalDescriptor } from "./signalsapi"
import { get, useDefinition } from "./defapi"

const { COMPONENT_ID } = component
const WILDCARD_PATH_TOKEN = "~{}"
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

type SlotDirection = "VERTICAL" | "HORIZONTAL"

type SlotDef = {
	name: string
	path?: string
	providesContexts?: SlotContextProvision[]
	defaultContent?: definition.DefinitionList
	label?: string
	direction?: SlotDirection
	onSelectSignals?: signal.SignalDefinition[]
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
	context && typeof context.getRouteContext === "function"
		? api.component.makeComponentId(
				context.getRouteContext(),
				"uesio/builder.mainwrapper",
				id,
				true
		  )
		: ""

const getBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string
) => getExternalState<T>(getBuilderComponentId(context, id))

const useBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string,
	initialState?: T
) => useState<T>(getBuilderComponentId(context, id), initialState)

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

const useSelectedComponentOrSlotPath = (context: ctx.Context) => {
	const selectedPath = useSelectedPath(context)
	const selectedDef = useDefinition(context, selectedPath)
	return getSelectedComponentOrSlotPath(selectedPath, selectedDef)
}

const getSelectedSlotBasePath = (
	selectedPath: FullPath,
	selectedComponentPath: FullPath,
	slotDef: SlotDef
) => {
	const parts = parseSlotPath(slotDef.path)
	let slotPath = selectedComponentPath.clone()
	for (const part of parts) {
		if (part === WILDCARD_PATH_TOKEN) {
			const [index] = selectedPath.trimToSize(slotPath.size() + 1).pop()
			if (!index) break
			slotPath = slotPath.addLocal(index)
		} else {
			slotPath = slotPath.addLocal(part)
		}
		if (!selectedPath.startsWith(slotPath)) {
			break
		}
	}
	return slotPath
}

const getSelectedSlotPath = (
	selectedPath: FullPath,
	selectedComponentPath: FullPath,
	slotDef: SlotDef
) => {
	let slotPath = getSelectedSlotBasePath(
		selectedPath,
		selectedComponentPath,
		slotDef
	)
	slotPath = slotPath.addLocal(slotDef.name)
	return selectedPath.startsWith(slotPath) ? slotPath : undefined
}

const getSelectedSlotIndex = (
	selectedPath: FullPath,
	selectedComponentPath: FullPath,
	slotDef: SlotDef
) => {
	const parts = parseSlotPath(slotDef.path)
	let slotPath = selectedComponentPath.clone()
	for (const part of parts) {
		if (part === WILDCARD_PATH_TOKEN) {
			const [index] = selectedPath
				.trimToSize(slotPath.size() + 1)
				.popIndex()
			if (index === undefined) break
			return index
		} else {
			slotPath = slotPath.addLocal(part)
		}
		if (!selectedPath.startsWith(slotPath)) {
			break
		}
	}
	return undefined
}

const getSelectedComponentOrSlotPath = (
	selectedPath: FullPath,
	selectedDef: unknown
) => {
	const selectedComponentPath = getSelectedComponentPath(
		selectedPath,
		selectedDef
	)
	if (selectedComponentPath.equals(selectedPath)) return selectedPath

	const [componentType] = selectedComponentPath.pop()
	const slotsDef = getComponentDef(componentType)?.slots
	if (!slotsDef) return selectedComponentPath

	for (const slotDef of slotsDef) {
		const selectedSlotPath = getSelectedSlotPath(
			selectedPath,
			selectedComponentPath,
			slotDef
		)
		if (selectedSlotPath) {
			return selectedSlotPath
		}
	}
	return selectedComponentPath
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
	const signals: signal.SignalDefinition[] = [
		{
			signal: "panel/CLOSE_ALL",
		},
	]
	if (path) {
		const pathArray = component.path.toPath(path.localPath)
		const isPanel = path.itemType === "viewdef" && pathArray[0] === "panels"
		if (isPanel) {
			const panelId = pathArray[1]
			signals.push({
				signal: "panel/OPEN",
				panel: panelId,
			})
		}
		// Walk up the path and find any components along the way.
		let basePath = path.getBase()
		for (const token of pathArray) {
			basePath = basePath.addLocal(token)
			if (!component.path.isComponentIndex(token)) continue
			const componentDef = getComponentDef(token)
			if (!componentDef || !componentDef.slots) continue

			for (const slotDef of componentDef.slots) {
				if (!slotDef.onSelectSignals) continue
				const selectedSlotIndex = getSelectedSlotIndex(
					path,
					basePath,
					slotDef
				)

				const selectedSlotBasePath = getSelectedSlotBasePath(
					path,
					basePath,
					slotDef
				)

				if (
					selectedSlotIndex !== undefined &&
					selectedSlotBasePath !== undefined
				) {
					const compDef = get(
						context,
						basePath
					) as definition.DefinitionMap

					const componentType = metadata.getKey(componentDef)

					const componentId =
						(compDef[COMPONENT_ID] as string) ||
						styles.hash(basePath.localPath)

					const mergeContext = context.addRecordDataFrame(
						get(
							context,
							selectedSlotBasePath
						) as wire.PlainWireRecord,
						selectedSlotIndex
					)

					slotDef.onSelectSignals.forEach((signal) =>
						signals.push(
							mergeContext.mergeMap({
								...signal,
								signal: "component/CALL",
								component: componentType,
								targettype: "multiple",
								target: componentId,
							})
						)
					)
				}
			}
		}
	}

	api.signal.runMany(signals, context)

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
			const slotComponents = getSlotComponents(slot, props)
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

const traverseSlotPath = (
	pathArray: string[],
	def: definition.Definition
): definition.Definition => {
	const [token, ...rest] = pathArray
	if (Array.isArray(def)) {
		if (!token) return def
		if (token !== WILDCARD_PATH_TOKEN)
			throw new Error("Invalid token for array")
		return def.flatMap((innerDef) => traverseSlotPath(rest, innerDef))
	}
	if (!token) return def
	return traverseSlotPath(rest, (def as definition.DefinitionMap)[token])
}

const trimSlotPath = (path: string | undefined) =>
	path?.startsWith("/") ? path.substring(1) : path || ""

const parseSlotPath = (path: string | undefined) =>
	path ? trimSlotPath(path).split("/") : []

const replaceSlotPath = (path: string | undefined, index: number) =>
	component.path.fromPath(
		parseSlotPath(path).map((token) =>
			token.replace(WILDCARD_PATH_TOKEN, index + "")
		)
	)

const getSlotsFromPath = (
	path: string | undefined,
	def: definition.Definition
) =>
	(path
		? traverseSlotPath(parseSlotPath(path), def)
		: [def]) as ComponentEntry[]

const getSlotComponents = (slot: SlotDef, def: definition.Definition) =>
	getSlotsFromPath(slot.path ? slot.path + "/" + slot.name : slot.name, def)

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
	useSelectedComponentOrSlotPath,
	getSelectedComponentPath,
	getSelectedComponentOrSlotPath,
	useSelectedViewPath,
	getSelectedViewPath,
	getSlotsFromPath,
	replaceSlotPath,
	getSelectedSlotPath,
	walkViewComponents,
}

export type { ComponentDef, SlotDef }

import { AnyAction, Store } from "redux"
import thunk, { ThunkDispatch, ThunkAction } from "redux-thunk"
import { Provider, useDispatch, useSelector } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"

import { Platform } from "../platform/platform"
import { mainReducer } from "../store/reducers"
import RuntimeState from "./types/runtimestate"
import { PlainWire } from "../wire/wire"
import { PlainComponentState } from "../componentactor/componentactor"
import { Definition } from "../definition/definition"
import get from "lodash.get"
import yaml from "yaml"
import { PlainView, View } from "../view/view"
import { ViewBand } from "../view/viewband"
import Dependencies from "./types/dependenciesstate"
import { MetadataListStore } from "./types/builderstate"
import { Context } from "../context/context"
import { metadata } from "@uesio/constants"

type DispatchReturn = Promise<Context>

type Dispatcher<T extends AnyAction> = ThunkDispatch<RuntimeState, Platform, T>
type ThunkFunc = ThunkAction<DispatchReturn, RuntimeState, Platform, AnyAction>

const defaultState = {
	collection: {},
	view: {},
	viewdef: {},
}

let platform: Platform
let store: Store

const create = (plat: Platform, initialState: RuntimeState): Store => {
	platform = plat
	store = configureStore({
		reducer: mainReducer,
		devTools: true,
		preloadedState: {
			...defaultState,
			...initialState,
		},
		middleware: [thunk.withExtraArgument(plat)],
	})
	return store
}

const getDispatcher = (): Dispatcher<AnyAction> => {
	return useDispatch()
}

const getPlatform = (): Platform => {
	return platform
}

const getStore = (): Store => {
	return store
}

// Both gets wire state and subscribes the component to wire changes
const useWire = (
	wireName: string | null,
	viewId: string | undefined
): PlainWire | null => {
	// Even if we don't have a wireName sent in, we still need to call useSelector
	// That way if a wire of that name ever comes available, we will be able to
	// pick up that subscription.
	return useSelector((state: RuntimeState) => {
		if (wireName && viewId) {
			return state.view?.[viewId].wires[wireName] || null
		}
		return null
	})
}

// Both gets view state and subscribes the component to wire changes
const useView = (
	namespace: string,
	name: string,
	path: string
): PlainView | null => {
	// Even if we don't have a viewName sent in, we still need to call useSelector
	// That way if a wire of that name ever comes available, we will be able to
	// pick up that subscription.
	return useSelector((state: RuntimeState) => {
		const viewId = ViewBand.makeId(namespace, name, path)
		return state.view?.[viewId] || null
	})
}

// Both gets component state and subscribes to component changes
const useComponentState = (
	componentId: string | null,
	viewId: string | undefined
): PlainComponentState | null => {
	// Even if we don't have a componentId sent in, we still need to call useSelector
	// That way if a component of that id ever comes available, we will be able to
	// pick up that subscription.
	return useSelector((state: RuntimeState) => {
		if (componentId && state.view && viewId) {
			return state.view[viewId].components[componentId] || null
		}
		return null
	})
}

const isMatch = (componentPath: string, testPath?: string): boolean => {
	if (testPath) {
		if (testPath === componentPath) {
			return true
		}
		if (testPath.startsWith(componentPath)) {
			const suffix = testPath.substring(componentPath.length)
			if (!suffix.includes(".")) {
				return true
			}
		}
	}
	return false
}

const useBuilderNodeState = (path: string): string => {
	return useSelector((state: RuntimeState) => {
		const buildState = state.builder
		if (buildState) {
			if (isMatch(path, buildState.selectedNode)) {
				return "selected"
			}
			if (isMatch(path, buildState.activeNode)) {
				return "active"
			}
		}
		return ""
	})
}

const useBuilderSelectedNode = (): string => {
	return useSelector((state: RuntimeState) => {
		const buildState = state.builder
		if (buildState) {
			if (buildState.selectedNode) {
				return buildState.selectedNode
			}
		}
		return ""
	})
}

const useBuilderDragNode = (): string => {
	return useSelector((state: RuntimeState) => {
		const buildState = state.builder
		if (buildState) {
			if (buildState.draggingNode) {
				return buildState.draggingNode
			}
		}
		return ""
	})
}

const useBuilderDropNode = (): string => {
	return useSelector((state: RuntimeState) => {
		const buildState = state.builder
		if (buildState) {
			if (buildState.droppingNode) {
				return buildState.droppingNode
			}
		}
		return ""
	})
}

const useBuilderLeftPanel = (): string => {
	return useSelector((state: RuntimeState) => {
		const buildState = state.builder
		if (buildState) {
			if (buildState.leftPanel) {
				return buildState.leftPanel
			}
		}
		return ""
	})
}

const useBuilderRightPanel = (): string => {
	return useSelector((state: RuntimeState) => {
		const buildState = state.builder
		if (buildState) {
			if (buildState.rightPanel) {
				return buildState.rightPanel
			}
		}
		return ""
	})
}

const useBuilderView = (): string => {
	return useSelector((state: RuntimeState) => {
		const buildState = state.builder
		if (buildState) {
			if (buildState.buildView) {
				return buildState.buildView
			}
		}
		return ""
	})
}

const useBuilderMode = (): boolean => {
	return useSelector((state: RuntimeState) => {
		const buildState = state.builder
		if (buildState) {
			return !!buildState.buildMode
		}
		return false
	})
}

const useBuilderHasChanges = (): boolean => {
	return useSelector((state: RuntimeState) => {
		// Loop over view defs
		if (state.viewdef) {
			for (const defKey of Object.keys(state.viewdef)) {
				const viewDef = state.viewdef[defKey]
				if (viewDef.yaml !== viewDef.originalYaml) {
					return true
				}
			}
		}
		return false
	})
}

const useBuilderMetadataList = (
	metadataType: metadata.MetadataType,
	namespace: string,
	grouping?: string
): MetadataListStore => {
	if (grouping) {
		return useSelector((state: RuntimeState) => {
			return (
				state.builder?.metadata?.[metadataType]?.[namespace]?.[
					grouping
				] || null
			)
		})
	}
	return useSelector((state: RuntimeState) => {
		return state.builder?.metadata?.[metadataType]?.[namespace] || null
	})
}

const useBuilderAvailableNamespaces = (): MetadataListStore => {
	return useSelector((state: RuntimeState) => {
		return state.builder?.namespaces || null
	})
}

const useViewDefinition = (view: View, path?: string): Definition => {
	return useSelector((state: RuntimeState) => {
		const viewDef = view.getViewDef(state)
		const definition = viewDef.getDefinition()
		if (path) {
			return get(definition, path || "")
		}
		return definition
	})
}

const useViewDependencies = (view: View): Dependencies | undefined => {
	return useSelector((state: RuntimeState) => {
		const viewDef = view.getViewDef(state)
		return viewDef.getDependencies()
	})
}

const useViewYAML = (view: View): yaml.Document | undefined => {
	return useSelector((state: RuntimeState) => {
		const viewDef = view.getViewDef(state)
		return viewDef.source.yaml
	})
}

const useViewConfigValue = (view: View, key: string): string => {
	return useSelector((state: RuntimeState) => {
		const viewdef = view.getViewDef(state)
		return viewdef.getDependencies()?.configvalues[key] || ""
	})
}

export {
	create,
	Provider,
	Dispatcher,
	ThunkFunc,
	DispatchReturn,
	getDispatcher,
	getPlatform,
	getStore,
	useWire,
	useView,
	useComponentState,
	useBuilderNodeState,
	useBuilderSelectedNode,
	useBuilderMode,
	useBuilderDragNode,
	useBuilderDropNode,
	useBuilderLeftPanel,
	useBuilderRightPanel,
	useBuilderView,
	useBuilderHasChanges,
	useBuilderMetadataList,
	useBuilderAvailableNamespaces,
	useViewYAML,
	useViewDefinition,
	useViewDependencies,
	useViewConfigValue,
}

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
import { Context } from "../context/context"

type DispatchReturn = Promise<Context>

type Dispatcher<T extends AnyAction> = ThunkDispatch<RuntimeState, Platform, T>
type ThunkFunc = ThunkAction<DispatchReturn, RuntimeState, Platform, AnyAction>

const defaultState = {
	collection: {},
	view: {},
	viewdef: {
		entities: {},
		ids: [],
	},
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
	useViewYAML,
	useViewDefinition,
	useViewDependencies,
	useViewConfigValue,
}

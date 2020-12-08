import { AnyAction, Store } from "redux"
import thunk, { ThunkDispatch, ThunkAction } from "redux-thunk"
import { Provider, useDispatch, useSelector } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"

import { Platform } from "../platform/platform"
import { mainReducer } from "../store/reducers"
import RuntimeState from "./types/runtimestate"
import { PlainWire } from "../wire/wire"
import { Definition } from "../definition/definition"
import get from "lodash.get"
import yaml from "yaml"
import { PlainView, View } from "../view/view"
import { ViewBand } from "../bands/view/band"
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

const create = (plat: Platform, initialState: RuntimeState) => {
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

const getDispatcher = (): Dispatcher<AnyAction> => useDispatch()
const getPlatform = () => platform
const getStore = () => store

// Both gets wire state and subscribes the component to wire changes
const useWire = (
	wireName: string | null,
	viewId: string | undefined
): PlainWire | null =>
	useSelector((state: RuntimeState) =>
		wireName && viewId ? state.view?.[viewId].wires[wireName] || null : null
	)

// Both gets view state and subscribes the component to wire changes
const useView = (
	namespace: string,
	name: string,
	path: string
): PlainView | null =>
	useSelector((state: RuntimeState) => {
		const viewId = ViewBand.makeId(namespace, name, path)
		return state.view?.[viewId] || null
	})

const useViewDefinition = (view: View, path?: string): Definition =>
	useSelector((state: RuntimeState) => {
		const viewDef = view.getViewDef(state)
		const definition = viewDef?.definition
		return path ? get(definition, path || "") : definition
	})

const useViewDependencies = (view: View): Dependencies | undefined =>
	useSelector((state: RuntimeState) => {
		const viewDef = view.getViewDef(state)
		return viewDef?.dependencies
	})

const useViewYAML = (view: View): yaml.Document | undefined =>
	useSelector((state: RuntimeState) => {
		const viewDef = view.getViewDef(state)
		return viewDef?.yaml
	})

const useViewConfigValue = (view: View, key: string): string =>
	useSelector((state: RuntimeState) => {
		const viewdef = view.getViewDef(state)
		return viewdef?.dependencies?.configvalues[key] || ""
	})

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
	useViewYAML,
	useViewDefinition,
	useViewDependencies,
	useViewConfigValue,
}

import { AnyAction, Store } from "redux"
import thunk, { ThunkDispatch, ThunkAction } from "redux-thunk"
import { Provider, useDispatch, useSelector } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"

import { Platform } from "../platform/platform"
import RuntimeState from "./types/runtimestate"
import { Definition } from "../definition/definition"
import get from "lodash.get"
import { Context } from "../context/context"
import { selectors } from "../bands/viewdef/adapter"

import collection from "../bands/collection"
import route from "../bands/route"
import user from "../bands/user"
import builder from "../bands/builder"
import viewdef from "../bands/viewdef"
import theme from "../bands/theme"
import component from "../bands/component"
import wire from "../bands/wire"
import view from "../bands/view"

type Dispatcher<T extends AnyAction> = ThunkDispatch<RuntimeState, Platform, T>
type ThunkFunc = ThunkAction<
	Promise<Context>,
	RuntimeState,
	Platform,
	AnyAction
>

let platform: Platform
let store: Store

const create = (plat: Platform, initialState: RuntimeState) => {
	platform = plat
	store = configureStore({
		reducer: {
			collection,
			component,
			route,
			user,
			builder,
			viewdef,
			view,
			theme,
			wire,
			site: (state) => state || {},
			workspace: (state) => state || {},
		},
		devTools: true,
		preloadedState: initialState,
		middleware: [thunk.withExtraArgument(plat)],
	})
	return store
}

const getDispatcher = (): Dispatcher<AnyAction> => useDispatch()
const getPlatform = () => platform
const getStore = () => store

const useViewDefinition = (viewDefId: string, path?: string): Definition =>
	useSelector((state: RuntimeState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		const definition = viewDef?.definition
		return path ? get(definition, path || "") : definition
	})

const useViewYAML = (viewDefId: string) =>
	useSelector((state: RuntimeState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		return viewDef?.yaml
	})

const useViewConfigValue = (viewDefId: string, key: string) =>
	useSelector((state: RuntimeState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		return viewDef?.dependencies?.configvalues[key] || ""
	})

export {
	create,
	Provider,
	Dispatcher,
	ThunkFunc,
	getDispatcher,
	getPlatform,
	getStore,
	useViewYAML,
	useViewDefinition,
	useViewConfigValue,
}

import { AnyAction } from "redux"
import thunk, { ThunkDispatch, ThunkAction } from "redux-thunk"
import { Provider, useDispatch, useSelector } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"

import { Platform } from "../platform/platform"
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
import { RouteState } from "../bands/route/types"
import { UserState } from "../bands/user/types"
import { BuilderState } from "../bands/builder/types"

type Dispatcher<T extends AnyAction> = ThunkDispatch<RootState, Platform, T>
type ThunkFunc = ThunkAction<Promise<Context>, RootState, Platform, AnyAction>

type InitialState = {
	builder: BuilderState
	route: RouteState
	user: UserState
	site: {
		name: string
		app: string
		version: string
	}
}

let platform: Platform
let store: ReturnType<typeof create>

const create = (plat: Platform, initialState: InitialState) => {
	platform = plat
	const newStore = configureStore({
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
	store = newStore
	return newStore
}

type RootState = ReturnType<typeof store.getState>

const getDispatcher = (): Dispatcher<AnyAction> => useDispatch()
const getPlatform = () => platform
const getStore = () => store

const useViewDefinition = (viewDefId: string, path?: string): Definition =>
	useSelector((state: RootState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		const definition = viewDef?.definition
		return path ? get(definition, path || "") : definition
	})

const useViewYAML = (viewDefId: string) =>
	useSelector((state: RootState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		return viewDef?.yaml
	})

const useViewConfigValue = (viewDefId: string, key: string) =>
	useSelector((state: RootState) => {
		const viewDef = selectors.selectById(state, viewDefId)
		return viewDef?.dependencies?.configvalues[key] || ""
	})

export {
	create,
	Provider,
	Dispatcher,
	ThunkFunc,
	RootState,
	InitialState,
	getDispatcher,
	getPlatform,
	getStore,
	useViewYAML,
	useViewDefinition,
	useViewConfigValue,
}

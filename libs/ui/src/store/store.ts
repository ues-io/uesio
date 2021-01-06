/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyAction } from "redux"
import thunk, { ThunkDispatch, ThunkAction } from "redux-thunk"
import { Provider, useDispatch } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"

import { Platform } from "../platform/platform"
import { Context } from "../context/context"

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
import toPath from "lodash.topath"

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

const builderActiveNodeMiddleware = (store: any) => (
	next: (action: AnyAction) => void
) => (action: AnyAction) => {
	const actionType = action.type
	const currentSelectedNode = store.getState()?.builder?.selectedNode
	const newName = action?.payload?.key
	const [nodeType] = toPath(action?.payload?.path) // nodeType is for example wires

	// dispatch to reducer
	next(action)
	// state has now been updated
	if (
		currentSelectedNode &&
		newName &&
		actionType === "viewdef/changeDefinitionKey" &&
		nodeType &&
		typeof nodeType === "string"
	) {
		// the selected node needs to be updated, since the name has changed
		store.dispatch({
			type: "builder/setSelectedNode",
			payload: `["${nodeType}"]["${newName}"]`,
		})
	}
}

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
		middleware: [
			thunk.withExtraArgument(plat),
			builderActiveNodeMiddleware,
		],
	})
	store = newStore
	return newStore
}

type RootState = ReturnType<typeof store.getState>

const getDispatcher = () => useDispatch<Dispatcher<AnyAction>>()
const getPlatform = () => platform
const getStore = () => store

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
}

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

	next(action)

	if (
		currentSelectedNode &&
		newName &&
		actionType === "viewdef/changeDefinitionKey"
	) {
		console.log("after actionType", actionType)
		console.log("after currentSelectedNode", currentSelectedNode)
		console.log("after newName", newName)

		// redux store has now been updated, so the new selected node needs to be updated
		store.dispatch({
			type: "builder/setSelectedNode",
			payload: `["wires"]["${newName}"]`,
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

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
import label from "../bands/label"
import component from "../bands/component"
import componentvariant from "../bands/componentvariant"
import wire from "../bands/wire"
import view from "../bands/view"
import site from "../bands/site"
import panel from "../bands/panel"
import notification from "../bands/notification"
import { RouteState } from "../bands/route/types"
import { UserState } from "../bands/user/types"
import { BuilderState } from "../bands/builder/types"

type Dispatcher<T extends AnyAction> = ThunkDispatch<RootState, Platform, T>
type ThunkFunc = ThunkAction<
	Promise<Context> | Context,
	RootState,
	Platform,
	AnyAction
>

type SiteState = {
	name: string
	app: string
	version?: string
	domain: string
	subdomain: string
}

type InitialState = {
	builder: BuilderState
	route: RouteState
	user: UserState
	site: SiteState
}

let platform: Platform
let store: ReturnType<typeof create>

const create = (plat: Platform, initialState: InitialState) => {
	platform = plat
	const newStore = configureStore({
		reducer: {
			collection,
			component,
			componentvariant,
			route,
			user,
			builder,
			viewdef,
			view,
			theme,
			label,
			panel,
			notification,
			wire,
			site,
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

export type AppDispatch = typeof store.dispatch
const getDispatcher = () => useDispatch<AppDispatch>()
const getPlatform = () => platform
const getStore = () => store

export {
	create,
	Provider,
	Dispatcher,
	ThunkFunc,
	RootState,
	InitialState,
	SiteState,
	getDispatcher,
	getPlatform,
	getStore,
}

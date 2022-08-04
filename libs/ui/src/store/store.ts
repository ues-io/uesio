import { AnyAction } from "redux"
import { ThunkAction } from "redux-thunk"
import { Provider } from "react-redux"
import { configureStore, EntityState } from "@reduxjs/toolkit"

import { Platform } from "../platform/platform"
import { Context } from "../context/context"

import collection from "../bands/collection"
import route from "../bands/route"
import user from "../bands/user"
import builder from "../bands/builder"
import component from "../bands/component"
import wire from "../bands/wire"
import site from "../bands/site"
import panel from "../bands/panel"
import viewdef from "../bands/viewdef"
import label from "../bands/label"
import theme from "../bands/theme"
import componentvariant from "../bands/componentvariant"
import configvalue from "../bands/configvalue"
import componentpack from "../bands/componentpack"
import notification from "../bands/notification"
import { RouteState } from "../bands/route/types"
import { UserState } from "../bands/user/types"
import { BuilderState } from "../bands/builder/types"
import { MetadataState } from "../bands/metadata/types"
import { parse } from "../yamlutils/yamlutils"
import { parseVariantKey } from "../component/path"

type ThunkFunc = ThunkAction<
	Promise<Context> | Context,
	RootState,
	Platform,
	AnyAction
>

type SiteState = {
	name: string
	app: string
	domain: string
	subdomain: string
}

type InitialState = {
	builder?: BuilderState
	route?: RouteState
	user?: UserState
	site?: SiteState
	theme?: EntityState<MetadataState>
	viewdef?: EntityState<MetadataState>
	componentvariant?: EntityState<MetadataState>
	componentpack?: EntityState<MetadataState>
	label?: EntityState<MetadataState>
	configvalue?: EntityState<MetadataState>
}

let platform: Platform
let store: ReturnType<typeof create>

const create = (plat: Platform, initialState: InitialState) => {
	platform = plat

	const themeState = initialState.theme
	if (themeState && themeState.ids?.length) {
		themeState.ids.forEach((id: string) => {
			const theme = themeState.entities[id] as MetadataState
			theme.parsed = parse(theme.content).toJSON()
		})
	}

	const viewDefState = initialState.viewdef
	if (viewDefState && viewDefState.ids?.length) {
		viewDefState.ids.forEach((id: string) => {
			const viewDef = viewDefState.entities[id] as MetadataState
			viewDef.parsed = parse(viewDef.content).toJSON()
		})
	}

	const componentVariantState = initialState.componentvariant
	if (componentVariantState && componentVariantState.ids?.length) {
		componentVariantState.ids.forEach((id: string) => {
			const componentVariant = componentVariantState.entities[
				id
			] as MetadataState

			const [cns, cn, ns] = parseVariantKey(id)
			componentVariant.parsed = {
				...parse(componentVariant.content).toJSON(),
				component: cns + "." + cn,
				namespace: ns,
			}
		})
	}

	const newStore = configureStore({
		reducer: {
			collection,
			component,
			route,
			user,
			builder,
			theme,
			panel,
			notification,
			wire,
			viewdef,
			label,
			componentvariant,
			configvalue,
			componentpack,
			site,
			workspace: (state) => state || {},
		},
		devTools: true,
		preloadedState: initialState,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				thunk: {
					extraArgument: plat,
				},
			}),
	})
	store = newStore
	return newStore
}

type RootState = ReturnType<typeof store.getState>

type Dispatcher = typeof store.dispatch

const appDispatch = () => store.dispatch
const getPlatform = () => platform
const getCurrentState = () => store.getState()

export {
	create,
	Provider,
	Dispatcher,
	ThunkFunc,
	RootState,
	InitialState,
	SiteState,
	appDispatch,
	getPlatform,
	getCurrentState,
}

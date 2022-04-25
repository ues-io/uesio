import { AnyAction } from "redux"
import thunk, { ThunkDispatch, ThunkAction } from "redux-thunk"
import { Provider, useDispatch } from "react-redux"
import { configureStore, EntityState } from "@reduxjs/toolkit"

import { Platform } from "../platform/platform"
import { Context } from "../context/context"

import collection from "../bands/collection"
import route from "../bands/route"
import user from "../bands/user"
import builder from "../bands/builder"
import component from "../bands/component"
import wire from "../bands/wire"
import view from "../bands/view"
import site from "../bands/site"
import panel from "../bands/panel"
import metadata from "../bands/metadata"
import notification from "../bands/notification"
import { RouteState } from "../bands/route/types"
import { UserState } from "../bands/user/types"
import { BuilderState } from "../bands/builder/types"
import { MetadataState } from "../bands/metadata/types"
import { parse } from "../yamlutils/yamlutils"

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
	metadata: EntityState<MetadataState>
}

let platform: Platform
let store: ReturnType<typeof create>

const create = (plat: Platform, initialState: InitialState) => {
	platform = plat

	// handle initialstate
	if (initialState.metadata?.ids?.length) {
		initialState.metadata.ids.forEach((id: string) => {
			const idSplit = id.split(":")
			const metadataType = idSplit[0]
			if (metadataType === "theme") {
				const theme = initialState.metadata.entities[
					id
				] as MetadataState
				theme.parsed = parse(theme.content).toJSON()
			}
		})
		initialState.metadata.entities
	}

	const newStore = configureStore({
		reducer: {
			collection,
			component,
			route,
			user,
			builder,
			view,
			metadata,
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

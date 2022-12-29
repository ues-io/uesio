import { Provider } from "react-redux"
import { configureStore, EntityState } from "@reduxjs/toolkit"

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
import featureflag from "../bands/featureflag"
import notification from "../bands/notification"
import metadatatext from "../bands/metadatatext"
import { RouteState } from "../bands/route/types"
import { UserState } from "../bands/user/types"
import { BuilderState } from "../bands/builder/types"
import { PlainViewDef } from "../definition/viewdef"
import { ThemeState } from "../definition/theme"
import { ComponentVariant } from "../definition/componentvariant"
import { LabelState } from "../definition/label"
import { ConfigValueState } from "../definition/configvalue"
import { FeatureFlagState } from "../definition/featureflag"
import { MetadataState } from "../bands/metadata/types"
import { PlainWire } from "../bands/wire/types"
import { PlainCollection } from "../bands/collection/types"
import { attachDefToWires } from "../bands/route/utils"

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
	theme?: EntityState<ThemeState>
	viewdef?: EntityState<PlainViewDef>
	componentvariant?: EntityState<ComponentVariant>
	label?: EntityState<LabelState>
	configvalue?: EntityState<ConfigValueState>
	featureflag?: EntityState<FeatureFlagState>
	metadatatext?: EntityState<MetadataState>
	wire?: EntityState<PlainWire>
	collection?: EntityState<PlainCollection>
}

let store: ReturnType<typeof create>

const create = (initialState: InitialState) => {
	attachDefToWires(initialState.wire, initialState.viewdef)

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
			featureflag,
			metadatatext,
			site,
			workspace: (state) => state || {},
		},
		devTools: true,
		preloadedState: initialState,
	})
	store = newStore
	return newStore
}

type RootState = ReturnType<typeof store.getState>

type Dispatcher = typeof store.dispatch

const dispatch = (action: Parameters<Dispatcher>[0]) => store.dispatch(action)

const getCurrentState = () => store.getState()

export {
	create,
	Provider,
	RootState,
	InitialState,
	SiteState,
	dispatch,
	getCurrentState,
}

import { configureStore, EntityState } from "@reduxjs/toolkit"

import collection from "../bands/collection"
import route from "../bands/route"
import user from "../bands/user"
import session from "../bands/session"
import component from "../bands/component"
import wire from "../bands/wire"
import file from "../bands/file"
import site, { SiteState } from "../bands/site"
import panel from "../bands/panel"
import viewdef from "../bands/viewdef"
import label from "../bands/label"
import theme from "../bands/theme"
import componentvariant from "../bands/componentvariant"
import configvalue from "../bands/configvalue"
import featureflag from "../bands/featureflag"
import notification from "../bands/notification"
import { RouteState } from "../bands/route/types"
import { UserState } from "../bands/user/types"
import { SessionState } from "../bands/session/types"
import { ViewMetadata } from "../definition/ViewMetadata"
import { ThemeState } from "../definition/theme"
import { ComponentVariant } from "../definition/componentvariant"
import { LabelState } from "../definition/label"
import { ConfigValueState } from "../definition/configvalue"
import { FeatureFlagState } from "../definition/featureflag"
import { ServerWire } from "../bands/wire/types"
import { PlainCollection } from "../bands/collection/types"
import { attachDefToWires } from "../bands/route/utils"
import { FileState } from "../definition/file"

type InitialState = {
	route?: RouteState
	user?: UserState
	session?: SessionState
	site?: SiteState
	theme?: EntityState<ThemeState>
	viewdef?: EntityState<ViewMetadata>
	componentvariant?: EntityState<ComponentVariant>
	label?: EntityState<LabelState>
	configvalue?: EntityState<ConfigValueState>
	featureflag?: EntityState<FeatureFlagState>
	wire?: EntityState<ServerWire>
	collection?: EntityState<PlainCollection>
	file?: EntityState<FileState>
}

let store: ReturnType<typeof create>

const create = (initialState: InitialState) => {
	attachDefToWires(initialState.wire, initialState.viewdef)

	const newStore = configureStore({
		reducer: {
			collection,
			component,
			file,
			route,
			user,
			session,
			theme,
			panel,
			notification,
			wire,
			viewdef,
			label,
			componentvariant,
			configvalue,
			featureflag,
			site,
		},
		devTools: true,
		preloadedState: initialState,
	})
	store = newStore
	return newStore
}

type RootState = ReturnType<typeof store.getState>

const dispatch = (action: Parameters<typeof store.dispatch>[0]) =>
	store.dispatch(action)

const getCurrentState = () => store.getState()

export type { RootState, InitialState }
export { create, dispatch, getCurrentState }

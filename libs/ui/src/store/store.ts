import { configureStore } from "@reduxjs/toolkit"

import collection, { adapter as collectionAdapter } from "../bands/collection"
import route from "../bands/route"
import user from "../bands/user"
import session from "../bands/session"
import component, { adapter as componentAdapter } from "../bands/component"
import wire, { adapter as wireAdapter } from "../bands/wire"
import file, { adapter as fileAdapter } from "../bands/file"
import site, { SiteState } from "../bands/site"
import panel from "../bands/panel"
import viewdef, { adapter as viewdefAdapter } from "../bands/viewdef"
import label, { adapter as labelAdapter } from "../bands/label"
import theme, { adapter as themeAdapter } from "../bands/theme"
import componentvariant, {
	adapter as componentvariantAdapter,
} from "../bands/componentvariant"
import componenttype, {
	adapter as componenttypeAdapter,
} from "../bands/componenttype"
import configvalue, {
	adapter as configvalueAdapter,
} from "../bands/configvalue"
import featureflag, {
	adapter as featureflagAdapter,
} from "../bands/featureflag"
import notification from "../bands/notification"
import { RouteState } from "../bands/route/types"
import { UserState } from "../bands/user/types"
import { SessionState } from "../bands/session/types"
import { ViewMetadata } from "../definition/ViewMetadata"
import { ThemeState } from "../definition/theme"
import { ComponentVariant } from "../definition/componentvariant"
import { Component } from "../definition/component"
import { LabelState } from "../definition/label"
import { ConfigValueState } from "../definition/configvalue"
import { FeatureFlagState } from "../definition/featureflag"
import { ServerWire } from "../bands/wire/types"
import { PlainCollection } from "../bands/collection/types"
import { attachDefToWires } from "../bands/route/utils"
import { FileState } from "../definition/file"
import { ComponentState } from "../bands/component/types"

type InitialState = {
	route?: RouteState
	user?: UserState
	session?: SessionState
	site?: SiteState
	theme?: ThemeState[]
	viewdef?: ViewMetadata[]
	componentvariant?: ComponentVariant[]
	componenttype?: Component[]
	label?: LabelState[]
	configvalue?: ConfigValueState[]
	featureflag?: FeatureFlagState[]
	wire?: ServerWire[]
	collection?: PlainCollection[]
	file?: FileState[]
	component?: ComponentState[]
}

let store: ReturnType<typeof create>

const create = (initialState: InitialState) => {
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
			componenttype,
			configvalue,
			featureflag,
			site,
		},
		devTools: true,
		preloadedState: {
			route: initialState.route,
			user: initialState.user,
			session: initialState.session,
			site: initialState.site,
			theme: themeAdapter.setAll(
				themeAdapter.getInitialState(),
				initialState.theme || []
			),
			viewdef: viewdefAdapter.setAll(
				viewdefAdapter.getInitialState(),
				initialState.viewdef || []
			),
			component: componentAdapter.setAll(
				componentAdapter.getInitialState(),
				initialState.component || []
			),
			componentvariant: componentvariantAdapter.setAll(
				componentvariantAdapter.getInitialState(),
				initialState.componentvariant || []
			),
			componenttype: componenttypeAdapter.setAll(
				componenttypeAdapter.getInitialState(),
				initialState.componenttype || []
			),
			label: labelAdapter.setAll(
				labelAdapter.getInitialState(),
				initialState.label || []
			),
			configvalue: configvalueAdapter.setAll(
				configvalueAdapter.getInitialState(),
				initialState.configvalue || []
			),
			featureflag: featureflagAdapter.setAll(
				featureflagAdapter.getInitialState(),
				initialState.featureflag || []
			),
			wire: wireAdapter.setAll(
				wireAdapter.getInitialState(),
				attachDefToWires(initialState.wire, initialState.viewdef) || []
			),
			collection: collectionAdapter.setAll(
				collectionAdapter.getInitialState(),
				initialState.collection || []
			),
			file: fileAdapter.setAll(
				fileAdapter.getInitialState(),
				initialState.file || []
			),
		},
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

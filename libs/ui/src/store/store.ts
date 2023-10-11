import { configureStore } from "@reduxjs/toolkit"

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
import componenttype from "../bands/componenttype"
import configvalue from "../bands/configvalue"
import featureflag from "../bands/featureflag"
import notification from "../bands/notification"
import { RouteState } from "../bands/route/types"
import { UserState } from "../bands/user/types"
import { SessionState } from "../bands/session/types"
import { newContext } from "../context/context"
import { handleNavigateResponse } from "../bands/route/operations"

type InitialState = {
	route?: RouteState
	user?: UserState
	session?: SessionState
	site?: SiteState
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
			user: initialState.user,
			session: initialState.session,
			site: initialState.site,
		},
	})
	store = newStore
	handleNavigateResponse(newContext(), initialState.route)
	return newStore
}

type RootState = ReturnType<typeof store.getState>

const dispatch = (action: Parameters<typeof store.dispatch>[0]) =>
	store.dispatch(action)

const getCurrentState = () => store.getState()

export type { RootState, InitialState }
export { create, dispatch, getCurrentState }

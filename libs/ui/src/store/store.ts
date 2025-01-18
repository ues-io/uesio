import { configureStore } from "@reduxjs/toolkit"

import collection from "../bands/collection"
import component from "../bands/component"
import componenttype from "../bands/componenttype"
import componentvariant from "../bands/componentvariant"
import configvalue from "../bands/configvalue"
import featureflag from "../bands/featureflag"
import file from "../bands/file"
import label from "../bands/label"
import notification from "../bands/notification"
import panel from "../bands/panel"
import route from "../bands/route"
import routeassignment from "../bands/routeassignment"
import selectlist from "../bands/selectlist"
import site, { SiteState } from "../bands/site"
import theme from "../bands/theme"
import user from "../bands/user"
import viewdef from "../bands/viewdef"
import wire from "../bands/wire"
import { RouteState } from "../bands/route/types"
import { UserState } from "../bands/user/types"
import { newContext } from "../context/context"
import { handleNavigateResponse } from "../bands/route/operations"

type InitialState = {
  route?: RouteState
  user?: UserState
  site?: SiteState
}

let store: ReturnType<typeof create>

const create = (initialState: InitialState) => {
  const newStore = configureStore({
    reducer: {
      collection,
      component,
      componenttype,
      componentvariant,
      configvalue,
      featureflag,
      file,
      label,
      notification,
      panel,
      route,
      routeassignment,
      selectlist,
      site,
      theme,
      user,
      viewdef,
      wire,
    },
    devTools: true,
    preloadedState: {
      user: initialState.user,
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

import { PlainCollectionMap } from "../../bands/collection/types"
import { RouteState } from "../../bands/route/types"
import { UserState } from "../../bands/user/types"
import { BuilderState } from "../../bands/builder/types"
import { ThemeState } from "../../bands/theme/types"
import { Action, EntityState, ThunkAction } from "@reduxjs/toolkit"
import { PlainViewDef } from "../../bands/viewdef/types"
import { ComponentState } from "../../bands/component/types"
import { PlainWire } from "../../bands/wire/types"
import { PlainView } from "../../bands/view/types"

type RuntimeState = {
	collection: PlainCollectionMap
	component: EntityState<ComponentState>
	builder?: BuilderState
	view: EntityState<PlainView>
	viewdef: EntityState<PlainViewDef>
	route: RouteState
	user: UserState
	site: {
		name: string
		app: string
		version: string
	}
	theme: ThemeState
	wire: EntityState<PlainWire>
}

export type AppThunk<ReturnType = void> = ThunkAction<
	ReturnType,
	RuntimeState,
	unknown,
	Action<string>
>
export default RuntimeState

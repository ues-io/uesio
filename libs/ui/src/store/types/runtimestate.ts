import { PlainCollectionMap } from "../../bands/collection/types"
import { PlainViewMap } from "../../view/view"
import { RouteState } from "../../bands/route/types"
import { UserState } from "../../bands/user/types"
import { BuilderState } from "../../bands/builder/types"
import { ThemeState } from "../../bands/theme/types"
import { EntityState } from "@reduxjs/toolkit"
import { PlainViewDef } from "../../bands/viewdef/types"
import { ComponentState } from "../../bands/component/types"
import { PlainWire } from "../../bands/wire/types"

type RuntimeState = {
	collection: PlainCollectionMap
	component: EntityState<ComponentState>
	builder?: BuilderState
	view?: PlainViewMap
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

export default RuntimeState

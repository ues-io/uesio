import { PlainCollectionMap } from "../../bands/collection/types"
import SiteState from "./sitestate"
import { PlainViewMap } from "../../view/view"
import { PlainViewDefMap } from "../../viewdef/viewdef"
import { RouteState } from "../../bands/route/types"
import { UserState } from "../../bands/user/types"
import { BuilderState } from "../../bands/builder/types"

type RuntimeState = {
	collection?: PlainCollectionMap
	builder?: BuilderState
	view?: PlainViewMap
	viewdef?: PlainViewDefMap
	route: RouteState
	user: UserState
	site: SiteState
}

export default RuntimeState

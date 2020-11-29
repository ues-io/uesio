import { PlainCollectionMap } from "../../bands/collection/types"
import BuilderState from "./builderstate"
import SiteState from "./sitestate"
import { PlainViewMap } from "../../view/view"
import { PlainViewDefMap } from "../../viewdef/viewdef"
import { RouteState } from "../../bands/route/types"
import { UserState } from "../../bands/user/types"

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

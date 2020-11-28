import { PlainCollectionMap } from "../../collection/collection"
import BuilderState from "./builderstate"
import UserState from "./userstate"
import SiteState from "./sitestate"
import RouteState from "./routestate"
import { PlainViewMap } from "../../view/view"
import { PlainViewDefMap } from "../../viewdef/viewdef"
import { ThemeState } from "../../theme/themetypes"

type RuntimeState = {
	collection?: PlainCollectionMap
	builder?: BuilderState
	view?: PlainViewMap
	viewdef?: PlainViewDefMap
	route: RouteState
	user: UserState
	site: SiteState
	theme: ThemeState
}

export default RuntimeState

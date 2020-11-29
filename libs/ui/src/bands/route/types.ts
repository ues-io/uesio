import { ViewParams } from "../../view/view"
import { navigateCreator, redirectCreator } from "./signals"

type WorkspaceState = {
	name: string
	app: string
}

type RouteState = {
	viewname: string
	viewnamespace: string
	params?: ViewParams
	namespace: string
	path: string
	workspace?: WorkspaceState
} | null

type RedirectSignal = ReturnType<typeof redirectCreator>
type NavigateSignal = ReturnType<typeof navigateCreator>

export { RouteState, WorkspaceState, RedirectSignal, NavigateSignal }

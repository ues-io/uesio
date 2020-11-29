import { ViewParams } from "../../view/view"
import { navigateSignal, redirectSignal } from "./signals"

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

type RedirectSignal = ReturnType<typeof redirectSignal>
type NavigateSignal = ReturnType<typeof navigateSignal>

// A type that describes all signals in the bot band
type RouteSignal = RedirectSignal | NavigateSignal

export {
	RouteState,
	WorkspaceState,
	RouteSignal,
	RedirectSignal,
	NavigateSignal,
}

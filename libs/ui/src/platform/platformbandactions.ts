import { BandAction } from "../store/actions/actions"
import UserState from "../store/types/userstate"

const LOGIN = "LOGIN"
const LOGOUT = "LOGOUT"

interface LoginAction extends BandAction {
	name: typeof LOGIN
	data: UserState
}

interface LogoutAction extends BandAction {
	name: typeof LOGOUT
	data: UserState
}

type PlatformBandAction = LoginAction | LogoutAction

export { LOGIN, LOGOUT, LoginAction, LogoutAction, PlatformBandAction }

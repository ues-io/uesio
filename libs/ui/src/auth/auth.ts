import { UserState } from "../bands/user/types"

type LoginRequest = {
	token: string
}

type LoginResponse = LoginResponsePath | LoginResponseRedirect

type LoginResponsePath = {
	user: UserState
	redirectPath: string
}

type LoginResponseRedirect = {
	user: UserState
	redirectRouteNamespace: string
	redirectRouteName: string
}

export { LoginRequest, LoginResponse }

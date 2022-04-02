import { UserState } from "../bands/user/types"

type LoginTokenRequest = {
	token: string
}

type LoginRequest = {
	username: string
	password: string
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

export { LoginRequest, LoginTokenRequest, LoginResponse }

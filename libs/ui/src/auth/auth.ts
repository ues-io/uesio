import { UserState } from "../bands/user/types"
import { SignalDefinition } from "../definition/signal"
export type LoginRequest = {
	type: string
	token: string
}

export type LoginResponse = LoginResponsePath | LoginResponseRedirect

type LoginResponsePath = {
	user: UserState
	redirectPath: string
}

type LoginResponseRedirect = {
	user: UserState
	redirectRouteNamespace: string
	redirectRouteName: string
}

export interface SignupSignal extends SignalDefinition {
	username: string
	password: string
	types: string
	email: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignupResponse = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignupRequest = any

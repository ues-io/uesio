import { ActorSignal } from "../definition/signal"

const LOGIN = "LOGIN"
const LOGOUT = "LOGOUT"
const NAVIGATE = "NAVIGATE"
const REDIRECT = "REDIRECT"

interface NavigateSignal extends ActorSignal {
	signal: typeof NAVIGATE
	path: string
	namespace: string
	noPushState?: boolean
}

interface RedirectSignal extends ActorSignal {
	signal: typeof REDIRECT
	path: string
}

interface LoginSignal extends ActorSignal {
	signal: typeof LOGIN
	data: {
		type: string
		token: string
	}
}

interface LogoutSignal extends ActorSignal {
	signal: typeof LOGOUT
}

export {
	LoginSignal,
	LogoutSignal,
	NavigateSignal,
	RedirectSignal,
	NAVIGATE,
	REDIRECT,
	LOGIN,
	LOGOUT,
}

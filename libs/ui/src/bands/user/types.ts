import { loginSignal, logoutSignal } from "./signals"

type UserState = {
	site: string
	firstname: string
	lastname: string
	profile: string
} | null

type LoginSignal = ReturnType<typeof loginSignal>
type LogoutSignal = ReturnType<typeof logoutSignal>

// A type that describes all signals in the bot band
type UserSignal = LoginSignal | LogoutSignal

export { UserState, UserSignal, LoginSignal, LogoutSignal }

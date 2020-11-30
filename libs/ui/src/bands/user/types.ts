import { loginCreator, logoutCreator } from "./signals"

type UserState = {
	site: string
	firstname: string
	lastname: string
	profile: string
} | null

type LoginSignal = ReturnType<typeof loginCreator>
type LogoutSignal = ReturnType<typeof logoutCreator>

export { UserState, LoginSignal, LogoutSignal }

import { Context } from "../../context/context"
import { BandSignal } from "../../definition/signal"
import operations from "./operations"

// The key for the entire band
const USER_BAND = "user"

interface LoginSignal extends BandSignal {
	type: string
	token: string
}

// "Signal Handlers" for all of the signals in the band
const signals = [
	{
		key: `${USER_BAND}/LOGIN`,
		dispatcher: (signal: LoginSignal, context: Context) =>
			operations.login(context, signal.type, signal.token),
	},
	{
		key: `${USER_BAND}/LOGOUT`,
		dispatcher: (signal: BandSignal, context: Context) =>
			operations.logout(context),
	},
]

export default signals

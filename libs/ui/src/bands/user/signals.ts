import operations from "./operations"

// The key for the entire band
const USER_BAND = "user"

// The keys for all signals in the band
const LOGIN = `${USER_BAND}/LOGIN`
const LOGOUT = `${USER_BAND}/LOGOUT`

// "Signal Creators" for all of the signals in the band
const loginCreator = (type: string, token: string) => ({
	signal: LOGIN,
	band: "", //TODO: remove this
	type,
	token,
})

const logoutCreator = () => ({
	signal: LOGOUT,
	band: "", //TODO: remove this
})

// "Signal Handlers" for all of the signals in the band
const signals = [
	{
		key: LOGIN,
		dispatcher: operations.login,
	},
	{
		key: LOGOUT,
		dispatcher: operations.logout,
	},
]

export { loginCreator, logoutCreator }
export default signals

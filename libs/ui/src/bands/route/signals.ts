import operations from "./operations"

// The key for the entire band
const ROUTE_BAND = "route"

// The keys for all signals in the band
const REDIRECT = `${ROUTE_BAND}/REDIRECT`
const NAVIGATE = `${ROUTE_BAND}/NAVIGATE`

// "Signal Creators" for all of the signals in the band
const redirectCreator = (path: string) => ({
	signal: REDIRECT,
	band: "", //TODO: remove this
	path,
})

const navigateCreator = (
	path: string,
	namespace: string,
	noPushState?: boolean
) => ({
	signal: NAVIGATE,
	band: "", //TODO: remove this
	path,
	namespace,
	noPushState,
})

// "Signal Handlers" for all of the signals in the band
const signals = [
	{
		key: REDIRECT,
		dispatcher: operations.redirect,
	},
	{
		key: NAVIGATE,
		dispatcher: operations.navigate,
	},
]

export { redirectCreator, navigateCreator }
export default signals

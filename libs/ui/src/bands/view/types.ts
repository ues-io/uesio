type ErrorState = {
	type: string
	message: string
}

type ErrorMap = {
	[key: string]: ErrorState
}

type ViewParams = {
	[key: string]: string
}

type PlainView = {
	viewDefId: string
	path: string
	params?: ViewParams
	errors?: ErrorMap
	loaded: boolean
}

export { PlainView, ViewParams }

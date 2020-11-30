import { actionTypes, Theme } from "./themetypes"

const makeThemeFectch = (theme: Theme) => ({
	type: actionTypes.THEME_FETCH,
	payload: theme,
})

const makeThemeFectching = (isLoading: boolean) => ({
	type: actionTypes.THEME_FETCHING,
	payload: isLoading,
})

export { makeThemeFectching, makeThemeFectch }

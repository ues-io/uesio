import { actionTypes, Theme } from "./themetypes"

const makeThemeFectch = (theme: Theme) => ({
	type: actionTypes.themefetch,
	payload: theme,
})

const makeThemeFectching = (isLoading: boolean) => ({
	type: actionTypes.themefetching,
	payload: isLoading,
})

export { makeThemeFectching, makeThemeFectch }

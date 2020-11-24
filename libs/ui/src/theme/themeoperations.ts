import { Dispatch } from "redux"
import { makeThemeFectching, makeThemeFectch } from "./themeactions"

const fetchTheme = (themeNamespace: string, themeName: string) => (
	dispatch: Dispatch
) => {
	dispatch(makeThemeFectching(true))

	fetch(
		`https://uesio-dev.com:3000/workspace/crm/dev/themes/${themeNamespace}/${themeName}`
	)
		.then((r) => r.json())
		.then((response) => dispatch(makeThemeFectch(response)))
}

export { fetchTheme }

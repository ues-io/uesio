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
		.then((response) =>
			dispatch(
				makeThemeFectch({
					id: response.id,
					name: response.name,
					namespace: response.namespace,
					workspace: response.workspace,
					definition: {
						primary: response.definition.primary,
						secondary: response.definition.secondary,
						error: response.definition.error,
						warning: response.definition.warning,
						info: response.definition.info,
						success: response.definition.success,
					},
				})
			)
		)
}

export { fetchTheme }

import { useEffect } from "react"
import { AnyAction } from "redux"
import { useTheme } from "../bands/theme/selectors"
import { parseKey } from "../component/path"
import { Context } from "../context/context"
import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"
import themeOps from "../bands/theme/operations"

class ThemeAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useTheme(themeId?: string, context?: Context) {
		const theme = useTheme(themeId || "")
		useEffect(() => {
			if (!theme && themeId) {
				const [namespace, name] = parseKey(themeId)

				if (namespace && name) {
					this.dispatcher(
						themeOps.fetchTheme({
							namespace,
							name,
							context: context || this.uesio.getContext(),
						})
					)
				}
			}
		})
		return theme
	}
}

export { ThemeAPI }

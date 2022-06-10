import { useEffect } from "react"
import { parseKey } from "../component/path"
import { Context } from "../context/context"
import { appDispatch } from "../store/store"
import { Uesio } from "./hooks"
import { platform } from "../platform/platform"
import { ThemeState } from "../definition/theme"
import { parse } from "../yamlutils/yamlutils"
import { useTheme, set as setTheme } from "../bands/theme"

class ThemeAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useTheme(themeId?: string, context?: Context) {
		const theme = useTheme(themeId || "")
		useEffect(() => {
			if (!theme && themeId) {
				const [namespace, name] = parseKey(themeId)

				if (namespace && name) {
					const fetchData = async () => {
						const themeResult = await platform.getTheme(
							context || this.uesio.getContext(),
							namespace,
							name
						)

						const yamlDoc = parse(themeResult)

						appDispatch()(
							setTheme({
								key: themeId,
								content: themeResult,
								parsed: yamlDoc.toJSON(),
							})
						)
					}

					fetchData()
				}
			}
		})
		return theme?.parsed as ThemeState
	}
}

export { ThemeAPI }

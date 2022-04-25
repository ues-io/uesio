import { useEffect } from "react"
import { AnyAction } from "redux"
import { parseKey } from "../component/path"
import { Context } from "../context/context"
import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"
import { platform } from "../platform/platform"
import { setMany as setMetadata } from "../bands/metadata"
import { useMetadataItem } from "../bands/metadata/selectors"
import { ThemeState } from "../definition/theme"
import { parse } from "../yamlutils/yamlutils"

class ThemeAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useTheme(themeId?: string, context?: Context) {
		const theme = useMetadataItem("theme", themeId || "")
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

						this.dispatcher(
							setMetadata([
								{
									key: themeId,
									type: "theme",
									content: themeResult,
									parsed: yamlDoc.toJSON(),
								},
							])
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

import { useEffect, useRef, useState } from "react"
import { Context } from "../context/context"
import { ConfigValueResponse, platform } from "../platform/platform"
import { Uesio } from "./hooks"

class ConfigValueAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useConfigValues(context: Context) {
		const [values, setValues] = useState<ConfigValueResponse[] | null>(null)
		const loading = useRef(false)
		useEffect(() => {
			if (!values && !loading.current) {
				loading.current = true
				platform
					.getConfigValues(context)
					.then(setValues)
					.finally(() => (loading.current = false))
			}
		})
		const reset = () => setValues(null)
		return [values, reset] as [ConfigValueResponse[] | null, () => void]
	}

	set(context: Context, key: string, value: string) {
		return platform.setConfigValue(context, key, value)
	}
}

export { ConfigValueAPI }

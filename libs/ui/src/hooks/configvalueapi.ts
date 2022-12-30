import { useEffect, useRef, useState } from "react"
import { Context } from "../context/context"
import { ConfigValueResponse, platform } from "../platform/platform"

const useConfigValues = (context: Context) => {
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

const set = platform.setConfigValue

export { useConfigValues, set }

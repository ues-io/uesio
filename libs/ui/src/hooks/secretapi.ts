import { useEffect, useRef, useState } from "react"
import { Context } from "../context/context"
import { platform, SecretResponse } from "../platform/platform"

const useSecrets = (context: Context) => {
	const [secrets, setSecrets] = useState<SecretResponse[] | null>(null)
	const loading = useRef(false)
	useEffect(() => {
		if (!secrets && !loading.current) {
			loading.current = true
			platform
				.getSecrets(context)
				.then(setSecrets)
				.finally(() => (loading.current = false))
		}
	}, [secrets, context])
	const reset = () => setSecrets(null)
	return [secrets, reset] as [SecretResponse[] | null, () => void]
}

const set = platform.setSecret

export { set, useSecrets }

import { useEffect, useRef, useState } from "react"
import { Context } from "../context/context"
import { platform, SecretResponse } from "../platform/platform"
import { Uesio } from "./hooks"

class SecretAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useSecrets(context: Context) {
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
		})
		const reset = () => setSecrets(null)
		return [secrets, reset] as [SecretResponse[] | null, () => void]
	}

	set(context: Context, key: string, value: string) {
		return platform.setSecret(context, key, value)
	}
}

export { SecretAPI }

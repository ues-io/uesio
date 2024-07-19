import { DependencyList, useEffect, useRef, useState } from "react"
import { getErrorString } from "../bands/utils"

const usePlatformFunc = <T>(
	platFunc: () => Promise<T> | T,
	deps?: DependencyList,
	enabled = true
): [T | undefined, string | undefined] => {
	const [value, setValue] = useState<T | undefined>(undefined)
	const [error, setError] = useState<string | undefined>(undefined)
	const loading = useRef(false)
	useEffect(() => {
		if (!loading.current && enabled) {
			;(async () => {
				loading.current = true
				try {
					const response = await platFunc()
					loading.current = false
					setValue(response)
					setError(undefined)
				} catch (error) {
					const message = getErrorString(error)
					loading.current = false
					setValue(undefined)
					setError(message)
				}
			})()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps || [])
	return [value, error]
}

export default usePlatformFunc

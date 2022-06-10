import { DependencyList, useEffect, useRef, useState } from "react"

const usePlatformFunc = <T>(
	platFunc: () => Promise<T> | T,
	deps?: DependencyList
) => {
	const [value, setValue] = useState<T | undefined>(undefined)
	const loading = useRef(false)
	useEffect(() => {
		if (!loading.current) {
			;(async () => {
				loading.current = true
				const response = await platFunc()
				loading.current = false
				setValue(response)
			})()
		}
	}, deps || [])
	return value
}

export default usePlatformFunc

import { useState, useCallback } from "react"

const cache = new Map()

const defaultOptions: UseAsyncOptions = {
	cacheKey: "",
	refetch: false,
}

export interface UseAsyncOptions {
	cacheKey: string
	refetch?: boolean
}

export interface UseAsyncResult {
	error?: unknown
	data?: unknown
	loading: boolean
}

export const useAsync = (options: UseAsyncOptions = defaultOptions) => {
	const [data, setData] = useState({
		data: null,
		error: null,
		loading: false,
	} as UseAsyncResult)
	// Merge the default options with the options passed in
	const { cacheKey, refetch } = options

	const run = useCallback(
		async (asyncFn) => {
			try {
				const result = { data: null, error: null, loading: false }

				// If we have a cache key and not requesting a new data, then return the cached data
				if (!refetch && cacheKey && cache.has(cacheKey)) {
					const res = cache.get(cacheKey)
					result.data = res
				} else {
					setData({ ...result, loading: true })
					const res = await asyncFn()
					result.data = res
					cacheKey && cache.set(cacheKey, res)
				}
				setData(result)
				return result
			} catch (error) {
				const result: UseAsyncResult = {
					data: null,
					error,
					loading: false,
				}
				setData(result)
				return result
			}
		},
		[cacheKey]
	)

	return {
		...data,
		run,
	}
}

const cache = new Map()

const defaultOptions: AsyncOptions = {
	cacheKey: "",
	refetch: false,
	timeout: -1,
}

export interface AsyncOptions {
	cacheKey: string
	refetch?: boolean
	timeout?: number
}

export interface AsyncResult<T> {
	error?: unknown
	data?: T | undefined
	loading: boolean
}

export type AsyncFunc<T> = () => Promise<T>

export const memoizedAsync = <T>(
	asyncFn: AsyncFunc<T>,
	options: AsyncOptions = defaultOptions
) =>
	new Promise((resolve, reject) => {
		// Merge the default options with the options passed in
		const { cacheKey, refetch, timeout = -1 } = options

		// If we have a cache key and not requesting a new data, then return the cached data
		if (!refetch && cacheKey && cache.has(cacheKey)) {
			resolve({
				data: cache.get(cacheKey) as T,
				loading: false,
			})
		}
		let timer: number
		if (timeout > -1) {
			timer = setTimeout(
				() =>
					reject({
						error: "Request timed out",
						loading: false,
					}),
				timeout
			) as unknown as number
		}
		// Otherwise, indicate that we are currently fetching the data
		asyncFn()
			.then((res) => {
				clearTimeout(timer)
				cacheKey && cache.set(cacheKey, res)
				resolve({
					data: res,
					loading: false,
				} as AsyncResult<T>)
			})
			.catch((error) => {
				clearTimeout(timer)
				reject({
					error: error?.message,
					loading: false,
				})
			})
	})

const cache = new Map()

const defaultOptions: AsyncOptions = {
	cacheKey: "",
	refetch: false,
	timeout: 5000,
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
		// If we have a timeout, setup a timer to reject the promise to prevent it from hanging forever
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
		// Otherwise, kick off a fetch of the data
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

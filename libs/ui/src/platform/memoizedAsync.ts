import { Context } from "../context/context"
import { getJSON } from "./async"

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

type CacheEntry<T> = {
	promise?: Promise<T>
	loading: boolean
	result?: T
}

export type AsyncFunc<T> = () => Promise<T>

// memoizedAsync performs an async function and caches the result,
// returning the cached result on subsequent calls.
// It also supports a timeout and refetching,
// as well as deduplication of in-flight requests based on the cacheKey
export const memoizedAsync = <T>(
	asyncFn: AsyncFunc<T>,
	options: AsyncOptions = defaultOptions
) =>
	new Promise((resolve, reject) => {
		// Merge the default options with the options passed in
		const { cacheKey, refetch, timeout = -1 } = options

		if (!cacheKey) {
			reject("cacheKey is required")
			return
		}

		let timer: number
		let isOriginalFetch = true

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

		const handleSuccess = (res: T) => {
			clearTimeout(timer)
			// Only the original fetch should need to mess with cache
			if (isOriginalFetch) {
				cache.set(cacheKey, {
					result: res,
					loading: false,
				} as CacheEntry<T>)
			}
			resolve({
				data: res,
				loading: false,
			} as AsyncResult<T>)
			// Return the result so that piggybacker Promises will get it too
			return res
		}
		const handleError = (error: Error) => {
			clearTimeout(timer)
			// Since it was an error, we need to clear out the cache entry,
			// to allow the next request to try again
			if (isOriginalFetch) {
				cache.delete(cacheKey)
			}
			reject({
				error: error?.message,
				loading: false,
			})
			// Return the error so that piggybacker Promises will get it too
			return error
		}

		const cacheEntry: CacheEntry<T> = cache.get(cacheKey) as CacheEntry<T>

		if (cacheEntry !== undefined) {
			// If we are already fetching this, then piggyback on the same promise
			if (cacheEntry.loading && cacheEntry.promise) {
				isOriginalFetch = false
				cacheEntry.promise.then(handleSuccess).catch(handleError)
				return
			} else if (cacheEntry.result !== undefined && !refetch) {
				// We can resolve right away because we already have a result!
				handleSuccess(cacheEntry.result)
				return
			}
		} else {
			// There's either nothing in cache yet, or there was but we requeseted to refetch,
			// so we need to create a new entry and kick off a fetch of the data and cache it
			cache.set(cacheKey, {
				loading: true,
				promise: asyncFn().then(handleSuccess).catch(handleError),
			} as CacheEntry<T>)
		}
	})

export const memoizedGetJSON = <T>(context: Context, url: string) => {
	const cacheKey = `getJSON:${url}`
	return memoizedAsync<T>(() => getJSON(context, url), {
		cacheKey,
	})
		.then((res: AsyncResult<T>) => res.data)
		.catch((res: AsyncResult<T>) => res.error) as Promise<T>
}

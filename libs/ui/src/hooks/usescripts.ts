import { useState, useEffect } from "react"
// Hook
const cachedScripts: ScriptMap = {}
interface ScriptMap {
	[key: string]: ScriptCache
}

type ScriptCache = {
	loaded: boolean
	script: HTMLScriptElement
	fullKey: string
}

type ScriptResult = {
	error: boolean
	scripts: string[]
	loaded: boolean
}

const depsHaveNotLoaded = (want: string[], have: string[]) =>
	want.some((key) => !have.includes(key))

const depsHaveLoaded = (want: string[], have: string[]) =>
	!depsHaveNotLoaded(want, have)

const areNotAllLoaded = (cache: ScriptMap) =>
	Object.keys(cache).some((key) => !cache[key].loaded)

const areAllLoaded = (cache: ScriptMap) => !areNotAllLoaded(cache)

const allScriptsLoaded = (sources: string[]) => {
	for (const src of sources) {
		const cache = cachedScripts[src]
		if (!cache || !cache.loaded) {
			return false
		}
	}
	return true
}

const getLoadedScripts = (cache: ScriptMap) =>
	Object.keys(cache).reduce(
		(acc, key) => [...acc, ...(cache[key].loaded ? [key] : [])],
		[]
	)

const loadScripts = async (sources: string[]): Promise<ScriptResult> => {
	const scriptsToLoad: ScriptMap = {}
	return new Promise((resolve, reject) => {
		// Script event listener callbacks for load and error
		const onScriptLoad = function (this: HTMLScriptElement): void {
			const src = this.src
			const cachedScriptKey = Object.keys(cachedScripts).find((key) => {
				const item = cachedScripts[key]
				return item.fullKey === src
			})

			if (cachedScriptKey) {
				const cachedScript = cachedScripts[cachedScriptKey]
				cachedScript.loaded = true
				if (areAllLoaded(scriptsToLoad)) {
					Object.keys(scriptsToLoad).forEach((src: string) => {
						const scriptCacheItem = scriptsToLoad[src]
						scriptCacheItem.script.removeEventListener(
							"load",
							onScriptLoad
						)
						scriptCacheItem.script.removeEventListener(
							"error",
							onScriptError
						)
					})
					console.log(
						"SUCCESS LOADING scripT",
						getLoadedScripts(cachedScripts)
					)
					resolve({
						loaded: true,
						error: false,
						scripts: getLoadedScripts(cachedScripts),
					})
				}
			}
		}

		const onScriptError = function (this: HTMLScriptElement): void {
			const src = this.src
			// Remove from cachedScripts we can try loading again
			delete cachedScripts[src]
			Object.keys(scriptsToLoad).forEach((src: string) => {
				const scriptCacheItem = scriptsToLoad[src]
				scriptCacheItem.script.removeEventListener("load", onScriptLoad)
				scriptCacheItem.script.removeEventListener(
					"error",
					onScriptError
				)
			})
			reject({
				loaded: true,
				error: true,
				scripts: getLoadedScripts(cachedScripts),
			})
		}
		// If cachedScripts array already includes src that means another instance ...
		// ... of this hook already loaded this script, so no need to load again.
		sources.forEach((src: string) => {
			const cache = cachedScripts[src]
			if (!cache) {
				// Create script
				const script = document.createElement("script")
				script.src = src
				script.async = true
				script.type = "module"

				const scriptCacheItem = {
					loaded: false,
					script,
					fullKey: script.src,
				}

				scriptsToLoad[src] = scriptCacheItem
				cachedScripts[src] = scriptCacheItem

				script.addEventListener("load", onScriptLoad)
				script.addEventListener("error", onScriptError)

				// Add script to document body
				document.body.appendChild(script)
			} else if (!cache.loaded) {
				scriptsToLoad[src] = cache
				const script = cache.script
				script.addEventListener("load", onScriptLoad)
				script.addEventListener("error", onScriptError)
			}
		})

		if (Object.keys(scriptsToLoad).length === 0) {
			resolve({
				loaded: true,
				error: false,
				scripts: [],
			})
		}
	})
}

const useScripts = (sources: string[]): ScriptResult => {
	// Keeping track of script loaded and error state
	const [state, setState] = useState({
		loaded: false,
		error: false,
		scripts: getLoadedScripts(cachedScripts),
	})

	useEffect(
		() => {
			const scriptsToLoad: ScriptMap = {}

			// Script event listener callbacks for load and error
			const onScriptLoad = function (this: HTMLScriptElement): void {
				const src = this.src
				const cachedScriptKey = Object.keys(cachedScripts).find(
					(key) => {
						const item = cachedScripts[key]
						return item.fullKey === src
					}
				)

				if (cachedScriptKey) {
					const cachedScript = cachedScripts[cachedScriptKey]
					cachedScript.loaded = true
					if (areAllLoaded(scriptsToLoad)) {
						setState({
							loaded: true,
							error: false,
							scripts: getLoadedScripts(cachedScripts),
						})
					}
				}
			}

			const onScriptError = function (this: HTMLScriptElement): void {
				const src = this.src
				// Remove from cachedScripts we can try loading again
				delete cachedScripts[src]

				setState({
					loaded: true,
					error: true,
					scripts: getLoadedScripts(cachedScripts),
				})
			}
			// If cachedScripts array already includes src that means another instance ...
			// ... of this hook already loaded this script, so no need to load again.
			sources.forEach((src: string) => {
				const cache = cachedScripts[src]
				if (!cache) {
					// Create script
					const script = document.createElement("script")
					script.src = src
					script.async = true
					script.type = "module"

					const scriptCacheItem = {
						loaded: false,
						script,
						fullKey: script.src,
					}

					scriptsToLoad[src] = scriptCacheItem
					cachedScripts[src] = scriptCacheItem

					script.addEventListener("load", onScriptLoad)
					script.addEventListener("error", onScriptError)

					// Add script to document body
					document.body.appendChild(script)
				} else if (!cache.loaded) {
					scriptsToLoad[src] = cache
					const script = cache.script
					script.addEventListener("load", onScriptLoad)
					script.addEventListener("error", onScriptError)
				}
			})

			// Remove event listeners on cleanup
			return (): void => {
				Object.keys(scriptsToLoad).forEach((src: string) => {
					const scriptCacheItem = scriptsToLoad[src]
					scriptCacheItem.script.removeEventListener(
						"load",
						onScriptLoad
					)
					scriptCacheItem.script.removeEventListener(
						"error",
						onScriptError
					)
				})
			}
		},
		[sources.join(":")] // Only re-run effect if script src changes
	)

	if (allScriptsLoaded(sources)) {
		return {
			error: false,
			scripts: state.scripts,
			loaded: true,
		}
	}

	return {
		error: state.error,
		scripts: state.scripts,
		loaded: depsHaveLoaded(sources, state.scripts),
	}
}

export default useScripts

export { loadScripts }

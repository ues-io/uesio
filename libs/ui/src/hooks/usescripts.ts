import { useState, useEffect, useRef } from "react"

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
}

const depsHaveNotLoaded = (want: string[], have: string[]) =>
	want.some((key) => !have.includes(key))

const depsHaveLoaded = (want: string[], have: string[]) =>
	!depsHaveNotLoaded(want, have)

const areNotAllLoaded = (cache: ScriptMap) =>
	Object.keys(cache).some((key) => !cache[key].loaded)

const areAllLoaded = (cache: ScriptMap) => !areNotAllLoaded(cache)

const getLoadedScripts = (cache: ScriptMap) =>
	Object.keys(cache).reduce(
		(acc, key) => [...acc, ...(cache[key].loaded ? [key] : [])],
		[]
	)

const useScripts = (sources: string[]): ScriptResult => {
	const cachedScripts = useRef<ScriptMap>({})
	// Keeping track of script loaded and error state
	const [state, setState] = useState({
		loaded: false,
		error: false,
		scripts: getLoadedScripts(cachedScripts.current),
	})

	useEffect(
		() => {
			const scriptsToLoad: ScriptMap = {}
			state.loaded = false
			state.error = true

			// Script event listener callbacks for load and error
			const onScriptLoad = function (this: HTMLScriptElement): void {
				const src = this.src
				const cachedScriptKey = Object.keys(cachedScripts.current).find(
					(key) => {
						const item = cachedScripts.current[key]
						return item.fullKey === src
					}
				)

				if (cachedScriptKey) {
					const cachedScript = cachedScripts.current[cachedScriptKey]
					cachedScript.loaded = true
					if (areAllLoaded(scriptsToLoad)) {
						setState({
							loaded: true,
							error: false,
							scripts: getLoadedScripts(cachedScripts.current),
						})
					}
				}
			}

			const onScriptError = function (this: HTMLScriptElement): void {
				const src = this.src
				// Remove from cachedScripts we can try loading again
				delete cachedScripts.current[src]

				setState({
					loaded: true,
					error: true,
					scripts: getLoadedScripts(cachedScripts.current),
				})
			}
			// If cachedScripts array already includes src that means another instance ...
			// ... of this hook already loaded this script, so no need to load again.
			sources.forEach((src: string) => {
				if (!cachedScripts.current[src]) {
					// Create script
					const script = document.createElement("script")
					script.src = src
					script.async = true

					const scriptCacheItem = {
						loaded: false,
						script,
						fullKey: script.src,
					}

					scriptsToLoad[src] = scriptCacheItem
					cachedScripts.current[src] = scriptCacheItem

					script.addEventListener("load", onScriptLoad)
					script.addEventListener("error", onScriptError)

					// Add script to document body
					document.body.appendChild(script)
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

	return {
		error: state.error,
		scripts: state.scripts,
	}
}

export { useScripts, depsHaveLoaded }

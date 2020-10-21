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
}

function depsHaveNotLoaded(want: string[], have: string[]): boolean {
	return want.some((key) => !have.includes(key))
}

function depsHaveLoaded(want: string[], have: string[]): boolean {
	return !depsHaveNotLoaded(want, have)
}

function areNotAllLoaded(cache: ScriptMap): boolean {
	return Object.keys(cache).some((key) => !cache[key].loaded)
}

function areAllLoaded(cache: ScriptMap): boolean {
	return !areNotAllLoaded(cache)
}

function getLoadedScripts(cache: ScriptMap): string[] {
	return Object.keys(cache).reduce(
		(acc, key) => [...acc, ...(cache[key].loaded ? [key] : [])],
		[]
	)
}

function useScripts(sources: string[]): ScriptResult {
	// Keeping track of script loaded and error state
	const [state, setState] = useState({
		loaded: false,
		error: false,
		scripts: getLoadedScripts(cachedScripts),
	})

	useEffect(
		() => {
			const scriptsToLoad: ScriptMap = {}
			state.loaded = false
			state.error = true

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
				if (!cachedScripts[src]) {
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
					cachedScripts[src] = scriptCacheItem

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

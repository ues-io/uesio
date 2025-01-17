import { getPackUrlsForDeps } from "../bands/route/utils"
import { Context } from "../context/context"
import { ComponentPackState } from "../definition/componentpack"

const cachedScripts: ScriptMap = {}

interface ScriptMap {
	[key: string]: ScriptCache
}

type HTMLLoadableElement = HTMLScriptElement | HTMLLinkElement

type ScriptCache = {
	loaded: boolean
	script: HTMLLoadableElement
	fullKey: string
}

type ScriptResult = {
	error: boolean
	loaded: boolean
}

const areNotAllLoaded = (cache: ScriptMap) =>
	Object.keys(cache).some((key) => !cache[key].loaded)

const areAllLoaded = (cache: ScriptMap) => !areNotAllLoaded(cache)

const getLoadedScripts = () => {
	initializeScriptCache()
	return Object.keys(cachedScripts).reduce(
		(acc, key) => [...acc, ...(cachedScripts[key].loaded ? [key] : [])],
		[]
	)
}

const initializeScriptCache = () => {
	if (!Object.keys(cachedScripts).length) {
		const js = document.scripts
		for (let i = 0; i < js.length; i++) {
			const scriptNode = js[i]
			const srcAttribute = scriptNode.getAttribute("src")
			if (!srcAttribute) continue
			cachedScripts[srcAttribute] = {
				loaded: true,
				script: js[i],
				fullKey: scriptNode.src,
			}
		}
	}
}

const isScriptTag = (
	element: HTMLLoadableElement
): element is HTMLScriptElement => element.nodeName === "SCRIPT"

const getItemSource = (element: HTMLLoadableElement) =>
	isScriptTag(element) ? element.src : element.href

const getLoadItem = (src: string) => {
	if (src.endsWith(".css")) {
		const link = document.createElement("link")
		link.rel = "stylesheet"
		link.type = "text/css"
		link.href = src
		return {
			loaded: false,
			script: link,
			fullKey: link.href,
		}
	}
	const script = document.createElement("script")
	script.src = src
	script.async = true
	script.type = "module"
	return {
		loaded: false,
		script,
		fullKey: script.src,
	}
}

const getScriptsToLoad = (
	sources: string[],
	callback: (result: ScriptResult) => void
) => {
	initializeScriptCache()

	const scriptsToLoad: ScriptMap = {}

	const registerScriptEvents = (elem: HTMLLoadableElement) => {
		elem.addEventListener("load", onScriptLoad)
		elem.addEventListener("error", onScriptError)
	}

	const removeScriptEvents = () => {
		Object.keys(scriptsToLoad).forEach((src: string) => {
			const scriptCacheItem = scriptsToLoad[src]
			scriptCacheItem.script.removeEventListener("load", onScriptLoad)
			scriptCacheItem.script.removeEventListener("error", onScriptError)
		})
	}

	// Script event listener callbacks for load and error
	const onScriptLoad = function (this: HTMLLoadableElement): void {
		const src = getItemSource(this)
		const cachedScriptKey = Object.keys(cachedScripts).find((key) => {
			const item = cachedScripts[key]
			return item.fullKey === src
		})

		if (cachedScriptKey) {
			const cachedScript = cachedScripts[cachedScriptKey]
			cachedScript.loaded = true
			if (areAllLoaded(scriptsToLoad)) {
				removeScriptEvents()
				callback({
					loaded: true,
					error: false,
				})
			}
		}
	}
	const onScriptError = function (this: HTMLLoadableElement): void {
		const src = getItemSource(this)
		// Remove from cachedScripts we can try loading again
		delete cachedScripts[src]
		removeScriptEvents()
		callback({
			loaded: true,
			error: true,
		})
	}
	sources.forEach((src: string) => {
		const cache = cachedScripts[src]
		if (!cache) {
			const scriptCacheItem = getLoadItem(src)

			scriptsToLoad[src] = scriptCacheItem
			cachedScripts[src] = scriptCacheItem
			registerScriptEvents(scriptCacheItem.script)

			// Add script to document body
			document.body.appendChild(scriptCacheItem.script)
		} else if (!cache.loaded) {
			scriptsToLoad[src] = cache
			registerScriptEvents(cache.script)
		}
	})
	if (Object.keys(scriptsToLoad).length === 0) {
		callback({
			loaded: true,
			error: false,
		})
	}
	return removeScriptEvents
}

const loadScripts = async (
	packs: ComponentPackState[] | undefined,
	context: Context
): Promise<ScriptResult> => {
	const packsToLoad = getPackUrlsForDeps(packs, context)
	return new Promise((resolve, reject) => {
		getScriptsToLoad(packsToLoad, (result) => {
			result.error ? reject(result) : resolve(result)
		})
	})
}

export { loadScripts, getLoadedScripts }

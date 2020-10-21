import React from "react"
import ReactDOM from "react-dom"
import Runtime from "../components/runtime"
import { Platform } from "../platform/platform"
import RuntimeState from "../store/types/runtimestate"
import { Context } from "../context/context"

class Loader {
	constructor(platform: Platform) {
		this.platform = platform
	}

	platform: Platform

	async load(
		element: HTMLElement,
		initialState: RuntimeState
	): Promise<void> {
		ReactDOM.render(
			<Runtime
				{...{
					platform: this.platform,
					initialState,
					path: "",
					componentType: "uesio.runtime",
					context: new Context(),
				}}
			></Runtime>,
			element
		)
	}
}

export { Loader }

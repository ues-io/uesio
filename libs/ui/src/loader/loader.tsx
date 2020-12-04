import React from "react"
import ReactDOM from "react-dom"
import Runtime from "../components/runtime"
import { Platform } from "../platform/platform"
import RuntimeState from "../store/types/runtimestate"
import { Context } from "../context/context"
import { Provider, create } from "../store/store"

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
			<Provider store={create(this.platform, initialState)}>
				<Runtime path="" context={new Context()} />
			</Provider>,
			element
		)
	}
}

export { Loader }

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

	load(element: HTMLElement, initialState: RuntimeState): void {
		ReactDOM.render(
			<Provider store={create(this.platform, initialState)}>
				<React.StrictMode>
					<Runtime path="" context={new Context()} />
				</React.StrictMode>
			</Provider>,
			element
		)
	}
}

export { Loader }

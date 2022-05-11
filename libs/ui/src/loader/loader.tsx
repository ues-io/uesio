import { StrictMode } from "react"
import ReactDOM from "react-dom"
import Runtime from "../components/runtime"
import { platform } from "../platform/platform"
import { Context } from "../context/context"
import { Provider, create, InitialState } from "../store/store"

const loader = (element: HTMLElement | null, initialState: InitialState) => {
	ReactDOM.render(
		<StrictMode>
			<Provider store={create(platform, initialState)}>
				<Runtime
					path=""
					componentType="uesio/studio.runtime"
					context={new Context()}
				/>
			</Provider>
		</StrictMode>,
		element
	)
}

export { loader }

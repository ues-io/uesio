import { StrictMode } from "react"
import ReactDOM from "react-dom"
import { Provider } from "react-redux"
import Runtime from "../components/runtime"
import { Context } from "../context/context"
import { create, InitialState } from "../store/store"

const loader = (element: HTMLElement | null, initialState: InitialState) => {
	ReactDOM.render(
		<StrictMode>
			<Provider store={create(initialState)}>
				<Runtime path="" context={new Context()} />
			</Provider>
		</StrictMode>,
		element
	)
}

export { loader }

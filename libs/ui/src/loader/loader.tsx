import { StrictMode } from "react"
import ReactDOM from "react-dom"
import { Provider } from "react-redux"
import Route from "../utilities/route"
import { Context } from "../context/context"
import { create, InitialState } from "../store/store"

export default (element: HTMLElement | null, initialState: InitialState) => {
	ReactDOM.render(
		<StrictMode>
			<Provider store={create(initialState)}>
				<Route context={new Context()} />
			</Provider>
		</StrictMode>,
		element
	)
}

import { StrictMode } from "react"
import ReactDOM from "react-dom"
import { Provider } from "react-redux"
import Route from "../components/route"
import { Context } from "../context/context"
import { create, InitialState } from "../store/store"

export default (element: HTMLElement | null, initialState: InitialState) => {
	ReactDOM.render(
		<StrictMode>
			<Provider store={create(initialState)}>
				<Route path="" context={new Context()} />
			</Provider>
		</StrictMode>,
		element
	)
}

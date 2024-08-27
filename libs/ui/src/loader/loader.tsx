import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import Route from "../utilities/route"
import { Context } from "../context/context"
import { create, InitialState } from "../store/store"

export default (element: HTMLElement, initialState: InitialState) => {
	createRoot(element).render(
		<StrictMode>
			<Provider store={create(initialState)}>
				<Route context={new Context()} />
			</Provider>
		</StrictMode>
	)
}

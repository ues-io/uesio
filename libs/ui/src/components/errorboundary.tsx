import { Component } from "react"
import { BaseProps } from "../definition/definition"
import ComponentError from "./componenterror"

interface State {
	error: Error | null
}

class ErrorBoundary extends Component<BaseProps> {
	public state: State = { error: null }
	public updatedWithError = false

	public static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI.
		return { error }
	}

	public componentDidMount() {
		const { error } = this.state

		if (error !== null) {
			this.updatedWithError = true
		}
	}

	public reset() {
		this.updatedWithError = false
		this.setState({ error: null })
	}

	public componentDidUpdate() {
		const { error } = this.state
		if (error !== null && !this.updatedWithError) {
			this.updatedWithError = true
			return
		}
		if (error !== null) {
			this.reset()
		}
	}

	public render() {
		if (this.state.error) {
			return <ComponentError {...this.props} error={this.state.error} />
		}
		return this.props.children
	}

	static displayName = "ErrorBoundary"
}

export default ErrorBoundary

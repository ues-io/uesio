import { Component } from "react"
import { BaseProps } from "../definition/definition"
import ComponentError from "./componenterror"

interface State {
	error: Error | null
}

class ErrorBoundary extends Component<BaseProps> {
	public state: State = { error: null }

	public static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI.
		return { error }
	}

	public componentDidUpdate(prevProps: BaseProps) {
		const { error } = this.state
		// Only reset if the definition has changed
		if (error !== null && prevProps.definition !== this.props.definition) {
			this.setState({ error: null })
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

import { Component, ErrorInfo } from "react"
import { UtilityPropsPlus } from "../definition/definition"
import ComponentError from "./componenterror"

interface State {
	error?: Error
}

class ErrorBoundary extends Component<UtilityPropsPlus, State> {
	public state: State = {}

	public static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI.
		return { error }
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo)
	}

	public reset() {
		this.setState({ error: undefined })
	}

	public componentDidUpdate(prevProps: UtilityPropsPlus, prevState: State) {
		const { error } = this.state
		if (error !== undefined && prevState.error !== undefined) {
			this.reset()
		}
	}

	public render() {
		if (this.state.error) {
			return <ComponentError {...this.props} error={this.state.error} />
		}
		return this.props.children
	}
}

export default ErrorBoundary

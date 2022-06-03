import React, { Component, ErrorInfo } from "react"
import { UtilityPropsPlus } from "../definition/definition"
import ComponentError from "./componenterror"

interface State {
	hasError: boolean
	error?: Error
}

class ErrorBoundary extends Component<UtilityPropsPlus, State> {
	public state: State = {
		hasError: false,
	}

	public static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI.
		return { hasError: true, error }
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo)
	}

	public render() {
		if (this.state.hasError) {
			return <ComponentError {...this.props} error={this.state.error} />
		}

		return this.props.children
	}
}

export default ErrorBoundary

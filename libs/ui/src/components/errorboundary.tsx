import React, { Component, ErrorInfo, ReactNode } from "react"
import { UtilityPropsPlus } from "../definition/definition"
import SlotError from "./sloterror"
interface Props {
	children: ReactNode
	componentProps: UtilityPropsPlus
}

interface State {
	hasError: boolean
	error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
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
			return (
				<SlotError
					error={this.state.error}
					componentProps={this.props.componentProps}
				/>
			)
		}

		return this.props.children
	}
}

export default ErrorBoundary

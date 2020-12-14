import React, { FunctionComponent } from "react"
import { BaseProps } from "../definition/definition"
import { ComponentInternal } from "../component/component"

type Props = {
	severity?: "error" | "success" | "info" | "warning"
} & BaseProps

const Feedback: FunctionComponent<Props> = (props) => {
	const { children, context } = props
	return (
		<ComponentInternal
			{...props}
			componentType="material.alert"
			path=""
			context={context}
		>
			<div>Component Not Found: {children}</div>
		</ComponentInternal>
	)
}

Feedback.displayName = "Feedback"

export default Feedback

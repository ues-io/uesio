import React, { FunctionComponent } from "react"
import { BaseProps } from "../definition/definition"
import { ComponentInternal } from "../component/component"

type Props = {
	type: string
	message: JSX.Element
} & BaseProps

const Feedback: FunctionComponent<Props> = (props) => {
	const { message, context } = props
	return (
		<ComponentInternal
			{...props}
			componentType="material.alert"
			path=""
			context={context}
		>
			<div>Component Not Found: {message}</div>
		</ComponentInternal>
	)
}

Feedback.displayName = "Feedback"

export default Feedback

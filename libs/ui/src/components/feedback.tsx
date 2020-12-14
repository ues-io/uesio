import React, { FunctionComponent, useState, useEffect } from "react"
import { BaseProps } from "../definition/definition"
import { ComponentInternal } from "../component/component"

type Props = {
	severity?: "error" | "success" | "info" | "warning"
} & BaseProps

const Feedback: FunctionComponent<Props> = (props) => {
	const { children, context } = props
	const [doUnmount, setDoUnmont] = useState(false)

	// componentDidMount
	useEffect(() => {
		setTimeout(() => setDoUnmont(true), 2000)
	}, [])

	if (doUnmount) {
		return null
	}

	return (
		<div style={{ position: "absolute", top: 0, left: 0 }}>
			<ComponentInternal
				{...props}
				componentType="material.alert"
				path=""
				context={context}
			>
				<div>Component Not Found: {children}</div>
			</ComponentInternal>
		</div>
	)
}

Feedback.displayName = "Feedback"

export default Feedback

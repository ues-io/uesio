import React, { FunctionComponent } from "react"
import { BaseProps } from "../definition/definition"

const NotFound: FunctionComponent<BaseProps> = (props) => (
	<div>Component Not Found: {props.componentType}</div>
)

NotFound.displayName = "NotFound"

export default NotFound

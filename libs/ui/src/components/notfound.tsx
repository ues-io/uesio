import React, { FC } from "react"
import { BaseProps } from "../definition/definition"

const NotFound: FC<BaseProps> = (props) => (
	<div>Component Not Found: {props.componentType}</div>
)

NotFound.displayName = "NotFound"

export default NotFound

import { FunctionComponent } from "react"
import { BaseProps } from "../definition/definition"
import { createPortal } from "react-dom"
import usePortal from "../hooks/useportal"

const Panel: FunctionComponent<BaseProps> = (props) =>
	createPortal(props.children, usePortal())

export default Panel

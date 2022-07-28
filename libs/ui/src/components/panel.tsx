import { FC } from "react"
import { BaseProps } from "../definition/definition"
import { createPortal } from "react-dom"
import { portalsDomNode } from "./runtime"

const Panel: FC<BaseProps> = (props) =>
	createPortal(
		props.children,
		portalsDomNode?.current || document.createElement("div")
	)

export default Panel

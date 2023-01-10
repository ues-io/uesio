import { FC } from "react"
import { createPortal } from "react-dom"
import { portalsDomNode } from "./route"

const Panel: FC = (props) =>
	createPortal(
		props.children,
		portalsDomNode?.current || document.createElement("div")
	)

export default Panel

import { FC } from "react"
import { BaseProps } from "../definition/definition"
import { createPortal } from "react-dom"
import usePortal from "../hooks/useportal"

interface T extends BaseProps {
	targetElement?: Element | null
}

const Panel: FC<T> = (props) =>
	createPortal(props.children, usePortal(props.targetElement))

export default Panel

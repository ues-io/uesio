import { FunctionComponent, useRef } from "react"

import { CSSTransition } from "react-transition-group"

import { definition, styles } from "@uesio/ui"
import { CSSInterpolation } from "@emotion/css"

interface ExpandPanelProps extends definition.UtilityProps {
	expanded: boolean
}

const StyleDefaults = Object.freeze({
	root: {
		willChange: "max-height,min-height",
		boxSizing: "border-box",
		"&.expand-enter": {
			opacity: "0",
		},
		"&.expand-enter-active, &.expand-enter-done": {
			opacity: "1",
			transition: "all 0.2s ease-in",
		},
		"&.expand-exit": {
			opacity: "1",
		},
		"&.expand-exit-active, &.expand-exit-done": {
			opacity: "0",
			transition: "all 0.2s ease-in",
		},
	},
} as Record<string, CSSInterpolation>)

const ExpandPanel: FunctionComponent<ExpandPanelProps> = (props) => {
	const { children, expanded } = props
	const nodeRef = useRef<HTMLDivElement>(null)
	const classes = styles.useUtilityStyles(StyleDefaults, props)

	const setMaxHeight = () => {
		const node = nodeRef.current
		if (!node) return
		node.style.maxHeight = node.scrollHeight + "px"
		node.style.minHeight = node.scrollHeight + "px"
	}

	const unsetMaxHeight = () => {
		const node = nodeRef.current
		if (!node) return

		node.style.maxHeight = ""
		node.style.minHeight = ""
	}

	const zeroMaxHeight = () => {
		const node = nodeRef.current
		if (!node) return

		node.style.maxHeight = "0"
		node.style.minHeight = "0"
	}

	return (
		<>
			<CSSTransition
				unmountOnExit={true}
				nodeRef={nodeRef}
				mountOnEnter={true}
				in={expanded}
				timeout={200}
				classNames={"expand"}
				onEnter={zeroMaxHeight}
				onEntering={setMaxHeight}
				onEntered={unsetMaxHeight}
				onExit={setMaxHeight}
				onExiting={zeroMaxHeight}
				onExited={unsetMaxHeight}
			>
				<div ref={nodeRef} className={classes.root}>
					{children}
				</div>
			</CSSTransition>
		</>
	)
}

export default ExpandPanel

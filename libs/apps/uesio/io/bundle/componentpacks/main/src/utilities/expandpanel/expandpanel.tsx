import { useRef } from "react"

import { CSSTransition } from "react-transition-group"

import { definition, styles } from "@uesio/ui"

interface ExpandPanelProps {
	expanded: boolean
}

const StyleDefaults = Object.freeze({
	root: [],
	enter: ["opacity-0"],
	enterActive: ["opacity-100", "transition-all"],
	enterDone: ["opacity-100"],
	exit: ["opacity-100"],
	exitActive: ["opacity-0", "transition-all"],
	exitDone: ["opacity-0"],
})

const ExpandPanel: definition.UtilityComponent<ExpandPanelProps> = (props) => {
	const { children, expanded } = props
	const nodeRef = useRef<HTMLDivElement>(null)
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const setMaxHeight = () => {
		const node = nodeRef.current
		if (!node) return
		node.style.maxHeight = node.scrollHeight + "px"
	}

	const unsetMaxHeight = () => {
		const node = nodeRef.current
		if (!node) return
		node.style.maxHeight = ""
	}

	const zeroMaxHeight = () => {
		const node = nodeRef.current
		if (!node) return
		node.style.maxHeight = "0"
	}

	return (
		<CSSTransition
			unmountOnExit={true}
			mountOnEnter={true}
			nodeRef={nodeRef}
			in={expanded}
			timeout={200}
			onEnter={zeroMaxHeight}
			onEntering={setMaxHeight}
			onEntered={unsetMaxHeight}
			onExit={setMaxHeight}
			onExiting={zeroMaxHeight}
			onExited={unsetMaxHeight}
			classNames={classes}
		>
			<div className={classes.root} ref={nodeRef}>
				{children}
			</div>
		</CSSTransition>
	)
}

export default ExpandPanel

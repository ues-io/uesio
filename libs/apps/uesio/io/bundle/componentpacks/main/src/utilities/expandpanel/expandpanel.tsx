import { FunctionComponent, useRef } from "react"

import { CSSTransition } from "react-transition-group"

import { definition, styles } from "@uesio/ui"

interface ExpandPanelProps extends definition.UtilityProps {
	expanded: boolean
}

const StyleDefaults = Object.freeze({
	root: ["transition-all"],
	enter: ["opacity-0"],
	enteractive: ["opacity-1"],
	enterdone: ["opacity-1"],
	exit: ["opacity-1"],
	exitactive: ["opacity-0"],
	exitdone: ["opacity-0"],
})

const ExpandPanel: FunctionComponent<ExpandPanelProps> = (props) => {
	const { children, expanded } = props
	const nodeRef = useRef<HTMLDivElement>(null)
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

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
				onEnter={zeroMaxHeight}
				onEntering={setMaxHeight}
				onEntered={unsetMaxHeight}
				onExit={setMaxHeight}
				onExiting={zeroMaxHeight}
				onExited={unsetMaxHeight}
				classNames={{
					enter: "enter",
					enterActive: "enteractive",
					enterDone: "enterdone",
					exit: "exit",
					exitActive: "exitactive",
					exitDone: "exitdone",
				}}
			>
				<div ref={nodeRef} className={classes.root}>
					{children}
				</div>
			</CSSTransition>
		</>
	)
}

export default ExpandPanel

import { FunctionComponent, ReactNode, useState, useEffect } from "react"

import { CSSTransition } from "react-transition-group"

import { definition, styles, component } from "@uesio/ui"

interface ExpandPanelProps extends definition.UtilityProps {
	defaultExpanded?: boolean
	toggle?: ReactNode
	showArrow?: boolean
}

const IconButton = component.registry.getUtility("io.iconbutton")
const IOGrid = component.registry.getUtility("io.grid")

const ExpandPanel: FunctionComponent<ExpandPanelProps> = (props) => {
	const {
		showArrow = true,
		context,
		children,
		defaultExpanded = true,
		toggle,
	} = props
	const [expanded, setExpanded] = useState<boolean>(defaultExpanded)

	const classes = styles.useUtilityStyles(
		{
			root: {
				borderTop: "none",
				borderBottom: "1px solid #eee",
			},
			titlebar: {
				cursor: "pointer",
			},
			icon: {
				transform: expanded ? "rotate(0deg)" : "rotate(180deg)",
				transition: "all 0.3s ease",
				fontSize: "18px",
			},
			grid: {
				gridAutoFlow: "column",
				gridTemplateColumns: "1fr 0fr",
				alignItems: "center",
				padding: "8px",
			},
			content: {
				fontSize: "9pt",
				color: "#444",
				padding: "0 6px",
				willChange: "max-height",
				boxSizing: "border-box",
				"&.expand-enter": {
					opacity: "0",
				},
				"&.expand-enter-active, &.expand-enter-done": {
					opacity: "1",
					transition: "all 0.3s ease",
				},
				"&.expand-exit": {
					opacity: "1",
				},
				"&.expand-exit-active, &.expand-exit-done": {
					opacity: "0",
					transition: "all 0.3s ease",
				},
			},
		},
		props
	)

	const setMaxHeight = (node: HTMLElement) =>
		(node.style.maxHeight = node.scrollHeight + 20 + "px")

	const unsetMaxHeight = (node: HTMLElement) => (node.style.maxHeight = "0")

	return (
		<div className={classes.root}>
			<IOGrid
				context={context}
				className={classes.grid}
				onClick={() => setExpanded(!expanded)}
			>
				{toggle}
				{showArrow && (
					<IconButton
						className={classes.icon}
						size="small"
						icon="expand_more"
						color="#999"
						context={context}
					/>
				)}
			</IOGrid>
			<CSSTransition
				unmountOnExit={true}
				mountOnEnter={true}
				in={expanded}
				timeout={300}
				classNames={"expand"}
				onEnter={unsetMaxHeight}
				onEntering={setMaxHeight}
				onExit={setMaxHeight}
				onExiting={unsetMaxHeight}
			>
				<div className={classes.content}>{children}</div>
			</CSSTransition>
		</div>
	)
}

export default ExpandPanel

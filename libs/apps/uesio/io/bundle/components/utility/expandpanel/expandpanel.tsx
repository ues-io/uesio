import {
	FunctionComponent,
	useRef,
	ReactNode,
	useState,
	Children,
	Dispatch,
	SetStateAction,
	SyntheticEvent,
} from "react"

import { CSSTransition } from "react-transition-group"

import { definition, styles, component } from "@uesio/ui"

interface ExpandPanelProps extends definition.UtilityProps {
	defaultExpanded?: boolean
	toggle?: ReactNode
	showArrow?: boolean
	expandState?: [boolean, Dispatch<SetStateAction<boolean>>]
}

const IconButton = component.getUtility("uesio/io.iconbutton")
const IOGrid = component.getUtility("uesio/io.grid")

const ExpandPanel: FunctionComponent<ExpandPanelProps> = (props) => {
	const {
		showArrow = true,
		context,
		children,
		defaultExpanded = true,
		toggle,
		expandState,
	} = props
	const [expanded, setExpanded] =
		expandState || useState<boolean>(defaultExpanded)
	const nodeRef = useRef<HTMLDivElement>(null)

	const hasChildren = Children.count(children) > 0

	const classes = styles.useUtilityStyles(
		{
			root: {},
			titlebar: {
				cursor: "pointer",
			},
			icon: {
				transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
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
			innerContent: {},
		},
		props
	)

	const setMaxHeight = () => {
		const node = nodeRef.current
		if (!node) return
		node.style.maxHeight = node.scrollHeight + 20 + "px"
	}

	const unsetMaxHeight = () => {
		const node = nodeRef.current
		if (!node) return

		node.style.maxHeight = "0"
	}

	return (
		<div className={classes.root}>
			<IOGrid context={context} className={classes.grid}>
				{toggle}
				{showArrow && hasChildren && (
					<IconButton
						className={classes.icon}
						size="small"
						icon="expand_more"
						color="#999"
						context={context}
						onClick={(e: SyntheticEvent) => {
							e.stopPropagation()
							hasChildren && setExpanded && setExpanded(!expanded)
						}}
					/>
				)}
			</IOGrid>
			{hasChildren && (
				<CSSTransition
					unmountOnExit={true}
					nodeRef={nodeRef}
					mountOnEnter={true}
					in={expanded}
					timeout={300}
					classNames={"expand"}
					onEnter={unsetMaxHeight}
					onEntering={setMaxHeight}
					onExit={setMaxHeight}
					onExiting={unsetMaxHeight}
				>
					<div ref={nodeRef} className={classes.content}>
						<div className={classes.innerContent}>{children}</div>
					</div>
				</CSSTransition>
			)}
		</div>
	)
}

export default ExpandPanel

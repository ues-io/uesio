import {
	FunctionComponent,
	ReactNode,
	SyntheticEvent,
	useState,
	useEffect,
} from "react"

import { definition, styles, component } from "@uesio/ui"

interface ExpandPanelProps extends definition.UtilityProps {
	label?: string
	defaultExpanded?: boolean
	actions?: ReactNode
}

const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")
const IOGrid = component.registry.getUtility("io.grid")

const ExpandPanel: FunctionComponent<ExpandPanelProps> = (props) => {
	const { label, context, children, defaultExpanded = true, actions } = props
	const [expanded, setExpanded] = useState<boolean>(defaultExpanded)
	const [displayContent, setdisplayContent] = useState(defaultExpanded)
	const ariaControls = `expandPanel-${label}`
	const ariaLabelledBy = `accordionId-${label}`
	useEffect(() => {
		if (!expanded && displayContent) {
			setTimeout(() => {
				setdisplayContent(false)
			}, 300)
		}

		if (expanded && !displayContent) setdisplayContent(true)
	}, [expanded])

	const classes = styles.useUtilityStyles(
		{
			root: {
				// borderBottom: "1px solid #eee",
				padding: "6px 0px",
				borderTop: "none",
			},
			titlebar: {
				cursor: "pointer",
			},
			icon: {
				transform: expanded ? "rotate(0deg)" : "rotate(180deg)",
				transition: "all 0.3s ease",
				fontSize: "18px",
			},
			content: {
				visibility: displayContent ? "visible" : "hidden",
				fontSize: "1rem",
				color: "#444",
				padding: "0 6px",
				transition: "all 0.3s ease",
				maxHeight: expanded ? "999px" : "0px",
				opacity: expanded ? "1" : "0",
				transform: expanded ? "translateY(0)" : "translateY(-5px)",
				willChange: "max-height",
				boxSizing: "border-box",
			},
		},
		props
	)

	const titleBarActions = (
		<IOGrid context={context} styles={{ root: { gridAutoFlow: "column" } }}>
			{actions}
			<IconButton
				className={classes.icon}
				size="small"
				icon="expand_more"
				context={context}
			/>
		</IOGrid>
	)

	return (
		<div className={classes.root}>
			<TitleBar
				className={classes.titlebar}
				title={label}
				id={ariaLabelledBy}
				context={context}
				actions={titleBarActions}
				ariaExpanded={expanded}
				ariaControls={ariaControls}
				variant="io.expandpanel"
				styles={{
					root: {
						padding: "4px 8px",
					},
				}}
				onClick={() => setExpanded(!expanded)}
			/>
			<div
				role="region"
				aria-labelledby={ariaLabelledBy}
				id={ariaControls}
				className={classes.content}
			>
				{children}
			</div>
		</div>
	)
}

export default ExpandPanel

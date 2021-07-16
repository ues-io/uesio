import { FunctionComponent, ReactNode, SyntheticEvent, useState } from "react"
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

	const classes = styles.useUtilityStyles(
		{
			root: {},
			content: {
				display: expanded ? "block" : "none",
				fontSize: "9pt",
				color: "#444",
				padding: "6px",
			},
		},
		props
	)

	const titleBarActions = (
		<IOGrid context={context} styles={{ root: { gridAutoFlow: "column" } }}>
			{actions}
			<IconButton
				onClick={(event: SyntheticEvent): void => {
					event.stopPropagation()
					setExpanded(!expanded)
				}}
				size="small"
				icon="expand_more"
				context={context}
			/>
		</IOGrid>
	)

	return (
		<div className={classes.root}>
			<TitleBar
				title={label}
				context={context}
				actions={titleBarActions}
				variant="io.expandpanel"
				styles={{
					root: {
						padding: "4px 8px",
					},
				}}
			/>
			<div className={classes.content}>{children}</div>
		</div>
	)
}

export default ExpandPanel

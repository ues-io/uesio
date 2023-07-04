import { styles, definition, api } from "@uesio/ui"
import ExpandPanel from "../expandpanel/expandpanel"
import TitleBar from "../titlebar/titlebar"
import IconButton from "../iconbutton/iconbutton"
import { useEffect } from "react"
interface AccordionUtilityProps {
	title?: string
	subtitle?: string
	expandicon: string
	collapseicon: string
	expanded: boolean
}

const StyleDefaults = Object.freeze({
	root: ["flex", "justify-items-center"],
	content: [],
	title: [],
	subtitle: [],
	actions: [],
	components: [],
})

const Accordion: definition.UtilityComponent<AccordionUtilityProps> = (
	props
) => {
	const {
		title,
		subtitle,
		expandicon,
		collapseicon,
		expanded,
		context,
		children,
		id,
	} = props

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)
	const [expand, setExpanded] = api.component.useState<boolean>(
		"Accordion" + title + id,
		true
	)
	useEffect(() => {
		if (expanded && expanded !== true) {
			setExpanded(false)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const getIcon = () => (expand === true ? collapseicon : expandicon)

	return (
		<>
			<TitleBar
				title={title}
				subtitle={subtitle}
				context={context}
				classes={classes}
				actions={
					<>
						<IconButton
							context={context}
							icon={getIcon()}
							onClick={() => {
								setExpanded(!expand)
							}}
						/>
					</>
				}
			/>
			<ExpandPanel context={context} expanded={expand as boolean}>
				<div className={classes.components}>{children}</div>
			</ExpandPanel>
		</>
	)
}
Accordion.displayName = "AccordionUtility"
export default Accordion

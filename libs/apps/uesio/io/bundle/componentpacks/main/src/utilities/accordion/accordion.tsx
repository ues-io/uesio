import { definition, styles } from "@uesio/ui"
import IconButton from "../iconbutton/iconbutton"
import { useExpansion } from "../../shared/expansion"
import { useState } from "react"

interface AccordionProps {
	title?: string
	subtitle?: string
	expandedicon?: string
	collapseicon?: string
	componentId: string
}

const Accordion: definition.UtilityComponent<AccordionProps> = (props) => {
	const {
		context,
		expandedicon,
		collapseicon,
		title,
		subtitle,
		componentId,
	} = props
	const [expanded, setExpanded] = useExpansion(componentId + title)
	const [icon, setIcon] = useState(expandedicon)
	const classes = styles.useUtilityStyleTokens(
		{
			root: [],
			header: [],
			title: [],
		},
		props,
		"uesio/io.accordion"
	)
	const handleClick = () => {
		if (collapseicon && expandedicon) {
			if (expanded === true) {
				setIcon(collapseicon)
				setExpanded(false)
			} else {
				setIcon(expandedicon)
				setExpanded(true)
			}
		}
	}
	return (
		<>
			<div className={classes.header}>
				<div className={classes.title}>
					<div>{title}</div>
					<div>{subtitle}</div>
				</div>
				<IconButton
					context={context}
					icon={icon}
					onClick={() => handleClick()}
				/>
			</div>
			{expanded ? props.children : undefined}
		</>
	)
}

Accordion.displayName = "AccordionUtility"

export default Accordion

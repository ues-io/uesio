import { definition, styles } from "@uesio/ui"
import IconButton from "../iconbutton/iconbutton"
import { toggleExpansion, useExpansion } from "../../shared/expansion"
import { useState } from "react"

interface AccordionProps {
	title?: string
	subtitle?: string
	expandicon?: string
	collapseicon?: string
	componentId?: string
}

const Accordion: definition.UtilityComponent<AccordionProps> = (props) => {
	const { context, expandicon, collapseicon, title, subtitle, componentId } =
		props
	const [isExpanded] = useExpansion(
		componentId ? componentId + title : (title as string) + subtitle
	)
	const [icon, setIcon] = useState(expandicon ? expandicon : "expand_more")
	const classes = styles.useUtilityStyleTokens(
		{
			header: [],
			inner: [],
			title: [],
			subtitle: [],
			icon: [],
			body: [],
		},
		props,
		"uesio/io.accordion"
	)
	const handleClick = () => {
		// isExpanded
		setIcon(collapseicon ? collapseicon : "expand_less"),
			// 	  setIsExpanded(false))
			// 	: (setIcon(expandicon ? expandicon : "expand_more"),
			//	  setIsExpanded(true))
			toggleExpansion
	}
	return (
		<>
			<div className={classes.header}>
				<div className={classes.inner}>
					<div className={classes.title}>{title}</div>
					<div className={classes.subtitle}>{subtitle}</div>
				</div>
				<IconButton
					className={classes.icon}
					context={context}
					icon={icon}
					onClick={() => handleClick()}
				/>
			</div>
			<div className={classes.body}>
				{isExpanded ? props.children : undefined}
			</div>
		</>
	)
}

Accordion.displayName = "AccordionUtility"

export default Accordion

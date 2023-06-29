import { component, styles, definition, api } from "@uesio/ui"
import { default as IOAccordion } from "../../utilities/accordion/accordion"
import { useExpansion } from "../../shared/expansion"

type AccordionDefinition = {
	title?: string
	subtitle?: string
	expandicon?: string
	collapseicon?: string
}

const StyleDefaults = Object.freeze({
	header: [],
	title: [],
})

const Accordion: definition.UC<AccordionDefinition> = (props) => {
	const { definition, context, path } = props
	const { title, subtitle, expandicon, collapseicon } = definition
	const componentId = api.component.getComponentIdFromProps(props)
	const classes = styles.useStyleTokens(StyleDefaults, props)
	const [expanded] = useExpansion(componentId)
	console.log("expanded: ", expanded)
	return (
		<IOAccordion
			classes={classes}
			context={props.context}
			componentId={componentId}
			title={title}
			subtitle={subtitle}
			expandedicon={expandicon}
			collapseicon={collapseicon}
		>
			{expanded ? (
				<component.Slot
					definition={definition}
					listName="components"
					path={path}
					context={context}
					label="Accordion Components"
				/>
			) : undefined}
		</IOAccordion>
	)
}

Accordion.displayName = "Accordion"

export default Accordion

import { component, styles, definition, wire } from "@uesio/ui"
import { default as IOAccordion } from "../../utilities/accordion/accordion"
import { useExpansion } from "../../shared/expansion"

type AccordionDefinition = {
	title?: string
	subtitle?: string
	expandicon?: string
	collapseicon?: string
	wire: wire.Wire
}

const StyleDefaults = Object.freeze({
	header: [],
	inner: [],
	title: [],
	subtitle: [],
	icon: [],
	body: [],
})

const Accordion: definition.UC<AccordionDefinition> = (props) => {
	const { definition, context, path } = props
	const { title, subtitle, expandicon, collapseicon } = definition
	const classes = styles.useStyleTokens(StyleDefaults, props)
	const [isExpanded] = useExpansion(path)
	return (
		<IOAccordion
			classes={classes}
			context={props.context}
			componentId={path}
			title={title}
			subtitle={subtitle}
			expandicon={expandicon}
			collapseicon={collapseicon}
		>
			{isExpanded ? (
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

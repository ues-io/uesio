import { component, styles, definition } from "@uesio/ui"

type AccordionDefinition = {
	title?: string
	subtitle?: string
	expandicon: string
	collapseicon: string
	expanded?: boolean
}

const StyleDefaults = Object.freeze({
	root: ["my-[5px]", "mx-[5px]"],
	content: [],
	title: [],
	subtitle: [],
	actions: ["m-auto"],
	components: [],
})

const Accordion: definition.UC<AccordionDefinition> = (props) => {
	const { context, path, definition } = props
	const { title, subtitle, expandicon, collapseicon, expanded } = definition
	const IOAccordion = component.getUtility("uesio/io.accordion")
	const classes = styles.useStyleTokens(StyleDefaults, props)

	return (
		<>
			<IOAccordion
				context={context}
				title={title}
				subtitle={subtitle}
				expandicon={expandicon}
				collapseicon={collapseicon}
				expanded={expanded}
				id={path}
				classes={classes}
			>
				<div className={classes.components}>
					<component.Slot
						definition={definition}
						listName="components"
						path={path}
						context={context}
						label="Accordion Components"
					/>
				</div>
			</IOAccordion>
		</>
	)
}
Accordion.displayName = "AccordionUtility"
export default Accordion

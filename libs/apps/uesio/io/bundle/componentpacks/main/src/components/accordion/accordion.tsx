import { component, styles, definition, api } from "@uesio/ui"
import TitleBar from "../../utilities/titlebar/titlebar"
import ExpandPanel from "../../utilities/expandpanel/expandpanel"
import IconButton from "../../utilities/iconbutton/iconbutton"

type AccordionDefinition = {
	title?: string
	subtitle?: string
	expandicon: string
	collapseicon: string
	expanded?: boolean
}

const StyleDefaults = Object.freeze({
	root: [],
	content: [],
})

const Accordion: definition.UC<AccordionDefinition> = (props) => {
	const { context, path, definition, componentType } = props
	const { title, subtitle, expandicon, collapseicon, expanded } = definition
	const componentId = api.component.getComponentIdFromProps(props)
	const classes = styles.useStyleTokens(StyleDefaults, props)
	const [expand, setExpanded] = api.component.useState<boolean>(
		componentId,
		expanded
	)

	const getIcon = () => (expand === true ? collapseicon : expandicon)
	const toggleExpanded = () => setExpanded(!expand)

	return (
		<div className={classes.root}>
			<TitleBar
				title={title}
				subtitle={subtitle}
				context={context}
				onClick={toggleExpanded}
				actions={<IconButton context={context} icon={getIcon()} />}
			/>
			<ExpandPanel
				classes={{ root: classes.content }}
				expanded={!!expand}
				context={context}
			>
				<component.Slot
					definition={definition}
					listName="components"
					path={path}
					context={context}
					componentType={componentType}
				/>
			</ExpandPanel>
		</div>
	)
}
Accordion.displayName = "AccordionUtility"
export default Accordion

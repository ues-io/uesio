import { component, styles, definition, api, metadata, signal } from "@uesio/ui"
import TitleBar from "../../utilities/titlebar/titlebar"
import ExpandPanel from "../../utilities/expandpanel/expandpanel"
import IconButton from "../../utilities/iconbutton/iconbutton"
import { Fragment, useEffect } from "react"

export type AccordionItemDefinition = {
	id: string
	title: string
	components: definition.DefinitionList
	"uesio.display"?: component.DisplayCondition[]
	expanded?: boolean
}

type AccordionDefinition = {
	items?: AccordionItemDefinition[]
	titlebarVariant?: metadata.MetadataKey
	expandicon: string
	collapseicon: string
	initialItem?: string
}

interface SelectItemSignal extends signal.SignalDefinition {
	id: string
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	SELECT_ITEM: {
		dispatcher: (_, signal: SelectItemSignal) => signal.id,
	},
}

const StyleDefaults = Object.freeze({
	root: [],
	content: [],
	icon: [],
	expanded: [],
	titlebar: [],
	titlebarContent: [],
	titlebarContentExpanded: [],
})

const Accordion: definition.UC<AccordionDefinition> = (props) => {
	const { context, path, definition, componentType } = props
	const {
		items = [],
		titlebarVariant,
		expandicon = "expand_more",
		collapseicon = "expand_less",
		initialItem,
	} = definition
	const classes = styles.useStyleTokens(StyleDefaults, props)

	const componentId = api.component.getComponentIdFromProps(props)

	const [selectedItemId, setSelectedItem] = api.component.useState<string>(
		componentId,
		initialItem
	)
	const foundIndex = items.findIndex((item) => item.id === selectedItemId)
	const selectedIndex = foundIndex === -1 ? 0 : foundIndex
	const selectedItem = items[selectedIndex]
	const allVisibleItems = component.useShouldFilter<AccordionItemDefinition>(
		items,
		context
	)
	const shouldDisplaySelectedItem =
		allVisibleItems.findIndex((item) => item.id === selectedItem.id) > -1
	useEffect(() => {
		if (!shouldDisplaySelectedItem) {
			setSelectedItem(allVisibleItems[0]?.id)
		}
	}, [
		selectedItemId,
		shouldDisplaySelectedItem,
		items,
		setSelectedItem,
		allVisibleItems,
	])

	return (
		<div className={classes.root}>
			{allVisibleItems.map((item) => {
				const expanded = item.id === selectedItemId
				return (
					<Fragment key={item.id}>
						<TitleBar
							title={item.title}
							context={context}
							classes={{
								root: styles.cx(
									classes.titlebar,
									expanded && classes.expanded
								),
								content: styles.cx(
									classes.titlebarContent,
									expanded && classes.titlebarContentExpanded
								),
							}}
							variant={titlebarVariant}
							onClick={() =>
								setSelectedItem(expanded ? "" : item.id)
							}
							actions={
								<IconButton
									className={classes.icon}
									context={context}
									icon={
										expanded === true
											? collapseicon
											: expandicon
									}
								/>
							}
						/>
						<ExpandPanel
							classes={{ root: classes.content }}
							expanded={expanded}
							context={context}
						>
							<component.Slot
								definition={item}
								listName="components"
								path={path}
								context={context}
								componentType={componentType}
							/>
						</ExpandPanel>
					</Fragment>
				)
			})}
		</div>
	)
}
Accordion.signals = signals
Accordion.displayName = "Accordion"
export default Accordion

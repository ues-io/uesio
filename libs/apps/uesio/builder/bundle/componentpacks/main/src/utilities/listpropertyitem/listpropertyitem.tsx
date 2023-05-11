import { definition, component, context, wire } from "@uesio/ui"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import { FullPath } from "../../api/path"
import { setSelectedPath, useSelectedPath } from "../../api/stateapi"
import BuildActionsArea from "../../helpers/buildactionsarea"
import PropertiesForm from "../../helpers/propertiesform"
import PropNodeTag from "../../utilities/propnodetag/propnodetag"
import { ComponentProperty } from "../../properties/componentproperty"
import { PropertiesPanelSection } from "../../api/propertysection"
import { ReactNode } from "react"
import CloneAction from "../../actions/cloneaction"
import ItemTag from "../itemtag/itemtag"

export type PropertiesGetter = (
	item: wire.PlainWireRecord,
	context: context.Context
) => ComponentProperty[]

type ItemStringGetter = (item: wire.PlainWireRecord) => string

export type StringOrItemPropertyGetter = string | ItemStringGetter
export type PropertiesListOrGetter = ComponentProperty[] | PropertiesGetter

type Props = {
	displayTemplate: StringOrItemPropertyGetter
	parentPath: FullPath
	itemProperties?: PropertiesListOrGetter
	itemPropertiesPanelTitle?: StringOrItemPropertyGetter
	itemPropertiesSections?: PropertiesPanelSection[]
	itemChildren?: (item: wire.PlainWireRecord, index: number) => ReactNode
} & definition.UtilityComponent

const ListPropertyItem: definition.UtilityComponent<Props> = (props) => {
	const {
		context,
		parentPath,
		displayTemplate,
		itemProperties,
		itemPropertiesPanelTitle,
		itemPropertiesSections,
		itemChildren,
	} = props

	const selectedPath = useSelectedPath(context)

	const record = context.getRecord()

	if (!record) return null

	const index = context.getRecordDataIndex(record)
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const listItemPath = parentPath.addLocal(`${index}`)
	const selected = selectedPath && selectedPath.startsWith(listItemPath)

	return (
		<PropNodeTag
			onClick={(e: MouseEvent) => {
				e.stopPropagation()
				setSelectedPath(context, listItemPath)
			}}
			selected={selected}
			context={context}
			popperChildren={
				itemProperties && (
					<PropertiesForm
						id={listItemPath.combine()}
						path={listItemPath}
						context={context}
						title={
							(typeof itemPropertiesPanelTitle === "function"
								? itemPropertiesPanelTitle(record.source)
								: itemPropertiesPanelTitle) || "Properties"
						}
						properties={
							typeof itemProperties === "function"
								? itemProperties(record.source, context)
								: itemProperties
						}
						sections={itemPropertiesSections}
					/>
				)
			}
		>
			<ItemTag context={context}>
				{typeof displayTemplate === "function"
					? displayTemplate(record.source)
					: context.merge(displayTemplate)}
			</ItemTag>
			{itemChildren?.(record.source, index as number)}
			<IOExpandPanel context={context} expanded={selected}>
				<BuildActionsArea context={context}>
					<DeleteAction context={context} path={listItemPath} />
					<MoveActions context={context} path={listItemPath} />
					<CloneAction context={context} path={listItemPath} />
				</BuildActionsArea>
			</IOExpandPanel>
		</PropNodeTag>
	)
}

export default ListPropertyItem

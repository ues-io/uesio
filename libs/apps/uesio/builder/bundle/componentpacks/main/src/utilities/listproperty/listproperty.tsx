import { definition, wire, component } from "@uesio/ui"
import { FullPath } from "../../api/path"
import { PropertiesPanelSection } from "../../api/propertysection"
import {
	StringOrItemPropertyGetter,
	PropertiesListOrGetter,
} from "../listpropertyitem/listpropertyitem"
import {
	ListPropertyAction,
	ListPropertyItemChildrenFunction,
} from "../../properties/componentproperty"

type Props = {
	path: FullPath
	propertyName: string
	itemDisplayTemplate: StringOrItemPropertyGetter
	itemPropertiesPanelTitle: StringOrItemPropertyGetter
	itemProperties?: PropertiesListOrGetter
	itemPropertiesSections?: PropertiesPanelSection[]
	itemChildren?: ListPropertyItemChildrenFunction
	items: definition.DefinitionMap[]
	actions: ListPropertyAction[]
}

const ListProperty: definition.UtilityComponent<Props> = (props) => {
	const {
		itemProperties,
		itemPropertiesSections,
		itemPropertiesPanelTitle,
		itemDisplayTemplate,
		itemChildren,
		path,
		actions,
		context,
		items,
	} = props

	const TitleBar = component.getUtility("uesio/io.titlebar")
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
	const ListPropertyItem = component.getUtility(
		"uesio/builder.listpropertyitem"
	)

	return (
		<>
			<TitleBar
				variant="uesio/builder.propsubsection"
				title={""}
				context={context}
				actions={actions?.map((actionDef) => {
					const { label, action, icon } = actionDef
					return (
						<Button
							context={context}
							key={label}
							variant="uesio/builder.panelactionbutton"
							icon={
								<Icon
									context={context}
									icon={icon || "add"}
									variant="uesio/builder.actionicon"
								/>
							}
							label={label}
							onClick={() => {
								action?.({
									context,
									path,
									items,
								})
							}}
						/>
					)
				})}
			/>
			{items?.map((item: definition.DefinitionMap, index) => (
				<ListPropertyItem
					key={index}
					context={context.addRecordDataFrame(
						item as wire.PlainWireRecord,
						index
					)}
					parentPath={path}
					displayTemplate={itemDisplayTemplate}
					itemProperties={itemProperties}
					itemPropertiesSections={itemPropertiesSections}
					itemPropertiesPanelTitle={itemPropertiesPanelTitle}
					itemChildren={itemChildren}
				/>
			))}
		</>
	)
}

export default ListProperty

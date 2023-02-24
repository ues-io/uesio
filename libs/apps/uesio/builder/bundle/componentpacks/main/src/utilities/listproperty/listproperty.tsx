import { definition, wire, component } from "@uesio/ui"
import { FullPath } from "../../api/path"
import {
	ItemDisplayTemplate,
	PropertiesListOrGetter,
} from "../listpropertyitem/listpropertyitem"

type Props = {
	path: FullPath
	addLabel: string
	propertyName: string
	itemDisplayTemplate: ItemDisplayTemplate
	itemPropertiesPanelTitle: string
	itemProperties?: PropertiesListOrGetter
	items: definition.DefinitionMap[]
	addAction: () => void
} & definition.UtilityProps

const ListProperty: definition.UtilityComponent<Props> = (props) => {
	const {
		itemProperties,
		itemPropertiesPanelTitle,
		itemDisplayTemplate,
		path,
		addLabel,
		context,
		addAction,
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
				actions={
					<Button
						context={context}
						variant="uesio/builder.actionbutton"
						icon={
							<Icon
								context={context}
								icon="add"
								variant="uesio/builder.actionicon"
							/>
						}
						label={addLabel}
						onClick={addAction}
					/>
				}
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
					itemPropertiesPanelTitle={itemPropertiesPanelTitle}
				/>
			))}
		</>
	)
}

export default ListProperty

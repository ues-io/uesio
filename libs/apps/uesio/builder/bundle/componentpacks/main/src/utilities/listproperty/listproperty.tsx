import { definition, wire, component } from "@uesio/ui"

import { ComponentProperty } from "../../api/componentproperty"
import { FullPath } from "../../api/path"
import { get } from "../../api/defapi"

type Props = {
	path: FullPath
	addLabel: string
	propertyName: string
	itemDisplayTemplate: string
	itemPropertiesPanelTitle: string
	addAction: () => void
	itemProperties?: ComponentProperty[]
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
		propertyName,
	} = props

	const TitleBar = component.getUtility("uesio/io.titlebar")
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
	const ListPropertyItem = component.getUtility(
		"uesio/builder.listpropertyitem"
	)

	const listPropertyPath = path.addLocal(propertyName)
	const childItems = get(
		context,
		listPropertyPath
	) as definition.DefinitionMap[]

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
			{childItems?.map((item: definition.DefinitionMap, index) => (
				<ListPropertyItem
					key={index}
					context={context.addRecordDataFrame(
						item as wire.PlainWireRecord,
						index
					)}
					parentPath={listPropertyPath}
					displayTemplate={itemDisplayTemplate}
					itemProperties={itemProperties}
					itemPropertiesPanelTitle={itemPropertiesPanelTitle}
				/>
			))}
		</>
	)
}

export default ListProperty

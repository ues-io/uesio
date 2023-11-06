import { definition, component, wire } from "@uesio/ui"
import CloneKeyAction from "../../actions/clonekeyaction"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import { set } from "../../api/defapi"
import { FullPath } from "../../api/path"
import { setSelectedPath, useSelectedPath } from "../../api/stateapi"
import BuildActionsArea from "../../helpers/buildactionsarea"
import { MapProperty as MP } from "../../properties/componentproperty"
import PropNodeTag from "../../utilities/propnodetag/propnodetag"

type Definition = {
	property: MP
	path: FullPath
}

const MapProperty: definition.UC<Definition> = (props) => {
	const { context, definition } = props
	const { path, property } = definition
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
	const ExpandPanel = component.getUtility("uesio/io.expandpanel")

	const viewDefId = context.getViewDefId() || ""

	const selectedPath = useSelectedPath(context)

	const record = context.getRecord()
	if (!viewDefId || !record) return null

	const items = record.getFieldValue(property.name) as Record<
		string,
		wire.PlainWireRecord
	>

	const propertyPath = path.addLocal(property.name)
	const actions = property.actions || [
		{
			icon: "add",
			label: `New ${property.defaultKey}`,
			action: () =>
				set(
					context,
					propertyPath.addLocal(
						property.defaultKey +
							(Math.floor(Math.random() * 60) + 1)
					),
					property.defaultDefinition || {},
					true
				),
		},
	]

	return (
		<ScrollPanel
			variant="uesio/builder.mainsection"
			footer={
				<BuildActionsArea justify="space-around" context={context}>
					{actions &&
						actions.map((action) => (
							<Button
								key={action.label}
								context={context}
								variant="uesio/builder.panelactionbutton"
								icon={
									<Icon
										context={context}
										icon={action.icon || "add"}
										variant="uesio/builder.actionicon"
									/>
								}
								label={action.label}
								onClick={action.action}
							/>
						))}
				</BuildActionsArea>
			}
			context={context}
		>
			{items &&
				Object.entries(items).map(([key, item]) => {
					const itemPath = propertyPath.addLocal(key)
					return (
						<PropNodeTag
							key={key}
							onClick={() => setSelectedPath(context, itemPath)}
							selected={selectedPath.startsWith(itemPath)}
							context={context}
						>
							<component.Slot
								definition={property}
								listName="content"
								path={itemPath.combine()}
								context={context.addRecordDataFrame({
									key,
									value: item,
								})}
							/>
							<ExpandPanel
								context={context}
								expanded={itemPath.equals(selectedPath)}
							>
								<BuildActionsArea context={context}>
									<DeleteAction
										context={context}
										path={itemPath}
									/>
									<MoveActions
										context={context}
										path={itemPath}
									/>
									<CloneKeyAction
										context={context}
										path={itemPath}
									/>
								</BuildActionsArea>
							</ExpandPanel>
						</PropNodeTag>
					)
				})}
		</ScrollPanel>
	)
}

export default MapProperty

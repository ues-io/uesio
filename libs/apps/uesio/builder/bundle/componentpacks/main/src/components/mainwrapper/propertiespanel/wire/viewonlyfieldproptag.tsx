import { collection, component, definition, wire } from "@uesio/ui"

import { useState } from "react"
import DeleteAction from "../../../../actions/deleteaction"
import MoveActions from "../../../../actions/moveactions"
import { FullPath } from "../../../../api/path"
import { setSelectedPath } from "../../../../api/stateapi"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import PropNodeTag from "../../../../utilities/propnodetag/propnodetag"
import ItemTag from "../../../../utilities/itemtag/itemtag"
import PropertiesForm from "../../../../helpers/propertiesform"

interface T {
	fieldId: string
	fieldDef: wire.ViewOnlyField
	path: FullPath
	selectedPath: FullPath
}
const ViewOnlyFieldPropTag: definition.UtilityComponent<T> = (props) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const Text = component.getUtility("uesio/io.text")
	const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")

	const { fieldId, fieldDef, context, path, selectedPath } = props

	const [expanded, setExpanded] = useState<boolean>(false)

	const selected = path.equals(selectedPath)
	const hasSelectedChild = selectedPath.startsWith(path)
	const subFields = Object.keys(fieldDef?.fields || {})

	const nsInfo = {
		color: "black",
		icon: "preview",
	}

	return (
		<PropNodeTag
			draggable={`${fieldId}`}
			key={fieldId}
			selected={selected || hasSelectedChild}
			context={context}
			onClick={(e: MouseEvent) => {
				setSelectedPath(context, path)
				e.stopPropagation()
			}}
			popperChildren={
				<PropertiesForm
					id={path.combine()}
					path={path}
					context={context}
					title={`${fieldId}`}
					properties={[
						{
							name: "name",
							label: "Name",
							type: "KEY",
						},
						{
							name: "type",
							label: "Type",
							type: "SELECT",
							options: collection.addBlankSelectOption([
								{ label: "Auto Number", value: "AUTONUMBER" },
								{ label: "Check Box", value: "CHECKBOX" },
								{ label: "Date", value: "DATE" },
								{ label: "Email", value: "EMAIL" },
								{ label: "File", value: "FILE" },
								{ label: "Formula", value: "FORMULA" },
								{ label: "List", value: "LIST" },
								{ label: "Long Text", value: "LONGTEXT" },
								{ label: "Map", value: "MAP" },
								{ label: "Metadata", value: "METADATA" },
								{
									label: "Multi Metadata",
									value: "MULTIMETADATA",
								},
								{ label: "Multi Select", value: "MULTISELECT" },
								{ label: "Number", value: "NUMBER" },
								{ label: "Reference", value: "REFERENCE" },
								{
									label: "Reference Group",
									value: "REFERENCEGROUP",
								},
								{ label: "Select List", value: "SELECT" },
								{ label: "Struct", value: "STRUCT" },
								{ label: "Text", value: "TEXT" },
								{ label: "Timestamp", value: "TIMESTAMP" },
								{ label: "User", value: "USER" },
							]),
						},
						{
							name: "label",
							label: "Label",
							type: "TEXT",
						},
					]}
				/>
			}
		>
			<ItemTag context={context}>
				<NamespaceLabel
					context={context}
					metadatainfo={nsInfo}
					metadatakey={fieldId}
					title={`${fieldId}`}
				/>
				<div>
					{subFields && subFields.length > 0 && (
						<span
							onClick={(e) => {
								setExpanded(!expanded)
								e.stopPropagation()
							}}
						>
							<Text
								text={subFields.length + ""}
								context={context}
								variant="uesio/builder.infobadge"
							/>
						</span>
					)}
					<Text
						text={fieldDef.type ? fieldDef.type : "NEW"}
						context={context}
						variant="uesio/builder.infobadge"
					/>
				</div>
			</ItemTag>
			<IOExpandPanel context={context} expanded={selected}>
				<BuildActionsArea context={context}>
					<DeleteAction context={context} path={path} />
					<MoveActions context={context} path={path} />
				</BuildActionsArea>
			</IOExpandPanel>
		</PropNodeTag>
	)
}

export default ViewOnlyFieldPropTag

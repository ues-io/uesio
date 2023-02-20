import { definition, component } from "@uesio/ui"
import CloneKeyAction from "../../actions/clonekeyaction"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import { ComponentProperty } from "../../api/componentproperty"
import { FullPath } from "../../api/path"
import { setSelectedPath, useSelectedPath } from "../../api/stateapi"
import BuildActionsArea from "../../helpers/buildactionsarea"
import PropertiesForm from "../../helpers/propertiesform"
import PropNodeTag from "../../utilities/propnodetag/propnodetag"

type PropListItemDefinition = {
	propertyName: string
	displayTemplate: string
	parentPath: FullPath
	popperProperties?: ComponentProperty[]
}

const PropListItem: definition.UC<PropListItemDefinition> = (props) => {
	const {
		context,
		definition: {
			parentPath,
			propertyName,
			displayTemplate,
			popperProperties,
		},
	} = props

	const record = context.getRecord()
	const index = context.getRecordDataIndex(record)
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

	const viewDefId = context.getViewDefId() || ""
	if (!viewDefId || !record) return null

	const selectedPath = useSelectedPath(context)
	const listPath = parentPath.addLocal(propertyName)
	const listItemPath = listPath.addLocal(`${index}`)

	return (
		<PropNodeTag
			onClick={() => setSelectedPath(context, listItemPath)}
			selected={selectedPath.startsWith(listItemPath)}
			context={context}
			popperChildren={
				popperProperties && (
					<PropertiesForm
						path={listItemPath}
						context={context}
						properties={popperProperties}
					/>
				)
			}
		>
			<div className="tagroot">
				{context.merge(displayTemplate)}
				{/* <NamespaceLabel
					metadatainfo={nsInfo}
					context={context}
					metadatakey={collection}
				/> */}
			</div>
			<IOExpandPanel
				context={context}
				expanded={listItemPath.equals(selectedPath)}
			>
				<BuildActionsArea context={context}>
					<DeleteAction context={context} path={listItemPath} />
					<MoveActions context={context} path={listItemPath} />
					<CloneKeyAction context={context} path={listItemPath} />
				</BuildActionsArea>
			</IOExpandPanel>
		</PropNodeTag>
	)
}

export default PropListItem

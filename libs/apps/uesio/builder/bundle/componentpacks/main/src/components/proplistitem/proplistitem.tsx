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
	displayTemplate: string
	popperProperties?: ComponentProperty[]
}

const PropListItem: definition.UC<PropListItemDefinition> = (props) => {
	const {
		context,
		definition: { displayTemplate, popperProperties },
	} = props

	const record = context.getRecord()
	const index = context.getRecordDataIndex(record)

	const path = new FullPath()

	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

	const viewDefId = context.getViewDefId() || ""
	if (!viewDefId || !record) return null

	const selectedPath = useSelectedPath(context)
	// const nsInfo = getBuilderNamespace(
	// 	context,
	// 	collection as metadata.MetadataKey
	// )

	return (
		<PropNodeTag
			onClick={() => setSelectedPath(context, path)}
			selected={selectedPath.startsWith(path)}
			context={context}
			popperChildren={
				popperProperties && (
					<PropertiesForm
						path={path.addLocal(`["${index}"]`)}
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
				expanded={path.equals(selectedPath)}
			>
				<BuildActionsArea context={context}>
					<DeleteAction context={context} path={path} />
					<MoveActions context={context} path={path} />
					<CloneKeyAction context={context} path={path} />
				</BuildActionsArea>
			</IOExpandPanel>
		</PropNodeTag>
	)
}

export default PropListItem

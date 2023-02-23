import { definition, component, metadata } from "@uesio/ui"
import CloneKeyAction from "../../actions/clonekeyaction"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import { FullPath } from "../../api/path"
import {
	getBuilderNamespace,
	setSelectedPath,
	useSelectedPath,
} from "../../api/stateapi"
import BuildActionsArea from "../../helpers/buildactionsarea"
import NamespaceLabel from "../../utilities/namespacelabel/namespacelabel"
import PropNodeTag from "../../utilities/propnodetag/propnodetag"

type Props = {
	wireId: string
	collection?: string
}

const WireTag: definition.UC<Props> = (props) => {
	const { context } = props
	const record = context.getRecord()

	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

	const viewDefId = context.getViewDefId() || ""
	if (!viewDefId || !record) return null

	const wireId = record.getFieldValue("key") as string
	const collection = record.getFieldValue("value->collection") as string

	const path = new FullPath(
		"viewdef",
		viewDefId,
		component.path.fromPath(["wires"].concat(wireId))
	)

	const selectedPath = useSelectedPath(context)
	const nsInfo = getBuilderNamespace(
		context,
		collection as metadata.MetadataKey
	)

	return (
		<PropNodeTag
			onClick={() => setSelectedPath(context, path)}
			selected={selectedPath.startsWith(path)}
			context={context}
		>
			<div className="tagroot">
				{wireId}
				<NamespaceLabel
					metadatainfo={nsInfo}
					context={context}
					metadatakey={collection}
				/>
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

export default WireTag

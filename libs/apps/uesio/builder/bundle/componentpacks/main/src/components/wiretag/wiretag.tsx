import { definition, component, metadata } from "@uesio/ui"
import CloneKeyAction from "../../actions/clonekeyaction"
import DeleteAction from "../../actions/deleteaction"
import MoveActions from "../../actions/moveactions"
import { FullPath } from "../../api/path"
import {
	getBuilderNamespace,
	getSelectedPath,
	setSelectedPath,
} from "../../api/stateapi"
import BuildActionsArea from "../../helpers/buildactionsarea"
import NamespaceLabel from "../../utilities/namespacelabel/namespacelabel"
import PropNodeTag from "../../utilities/propnodetag/propnodetag"

type Props = {
	wireId: string
	collection?: string
}

const WireTag: definition.UC<Props> = (props) => {
	const { definition, context } = props
	const wireId = context.merge(definition.wireId) as string
	const collection = context.merge(definition.collection) as string
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

	const viewDefId = context.getViewDefId() || ""
	if (!viewDefId) return null
	const path = new FullPath(
		"viewdef",
		viewDefId,
		component.path.fromPath(["wires"].concat(wireId))
	)

	const selectedPath = getSelectedPath(context)
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

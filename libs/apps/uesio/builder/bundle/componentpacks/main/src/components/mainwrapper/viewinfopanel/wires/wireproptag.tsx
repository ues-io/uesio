import { definition, component, metadata, wire } from "@uesio/ui"
import CloneKeyAction from "../../../../actions/clonekeyaction"
import DeleteAction from "../../../../actions/deleteaction"
import MoveActions from "../../../../actions/moveactions"
import { useDefinition } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"

import { getBuilderNamespace, setSelectedPath } from "../../../../api/stateapi"
import BuildActionsArea from "../../../../helpers/buildactionsarea"
import NamespaceLabel from "../../../../utilities/namespacelabel/namespacelabel"
import PropNodeTag from "../../../../utilities/propnodetag/propnodetag"

type Props = {
	wireId: string
	path: FullPath
	selectedPath: FullPath
}

const WirePropTag: definition.UtilityComponent<Props> = (props) => {
	const { wireId, context, path, selectedPath } = props
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

	const wireDef = useDefinition(path) as wire.RegularWireDefinition
	const collectionKey = wireDef.collection as metadata.MetadataKey

	const nsInfo = getBuilderNamespace(context, collectionKey)

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
					metadatakey={collectionKey}
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

export default WirePropTag

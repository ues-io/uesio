import { definition } from "@uesio/ui"
import { useSelectedPath } from "../../../../api/stateapi"

import MetadataProp from "../../../../propertyrenderers/metadataprop"
import KeyProp from "../../../../propertyrenderers/keyprop"
import NumberProp from "../../../../propertyrenderers/numberprop"

const WireHome: definition.UtilityComponent = (props) => {
	const { context } = props
	const selectedPath = useSelectedPath(context)

	return (
		<>
			<KeyProp label="Name" path={selectedPath} context={context} />
			<MetadataProp
				metadataType="COLLECTION"
				label="Collection"
				path={selectedPath.addLocal("collection")}
				context={context}
			/>
			<NumberProp
				label="Batch Size"
				path={selectedPath.addLocal("batchsize")}
				context={context}
			/>
		</>
	)
}

WireHome.displayName = "WireHome"

export default WireHome

import { definition } from "@uesio/ui"
import {
	useSelectedPath,
	ComponentProperty,
	setSelectedPath,
} from "../../../../api/stateapi"
import PropertiesForm from "../../../../helpers/propertiesform"
import PropertiesWrapper from "../../../../components/mainwrapper/propertiespanel/propertieswrapper"

const wireHomeProperties = [
	{
		name: "wirename",
		label: "Wire Name",
		required: true,
		type: "KEY",
	},
	{
		name: "collection",
		label: "Collection",
		required: true,
		type: "METADATA",
		metadataType: "COLLECTION",
	},
	{
		name: "batchsize",
		label: "Batch Size",
		type: "NUMBER",
	},
] as ComponentProperty[]

const WireHome: definition.UtilityComponent = (props) => {
	const { context } = props
	const selectedPath = useSelectedPath(context)
	const path = selectedPath.trimToSize(2)

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={path}
			title={"Wire Home"}
			onUnselect={() => setSelectedPath(context)}
		>
			<PropertiesForm
				id={path.combine()}
				context={context}
				properties={wireHomeProperties}
				path={path}
			/>
		</PropertiesWrapper>
	)
}

WireHome.displayName = "WireHome"

export default WireHome

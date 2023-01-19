import { definition, component, wire } from "@uesio/ui"
import PropertiesWrapper from "./propertieswrapper"
import {
	setSelectedPath,
	useBuilderState,
	useSelectedPath,
} from "../../../api/stateapi"

import MetadataProp from "../../../propertyrenderers/metadataprop"
import { useDefinition } from "../../../api/defapi"
import KeyProp from "../../../propertyrenderers/keyprop"

const WireProperties: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const [wireName] = selectedPath.pop()

	// This forces a rerender if the definition changes
	useDefinition(selectedPath) as wire.WireDefinition

	const [selectedTab, setSelectedTab] = useBuilderState<string>(
		context,
		"wireselectedtab",
		""
	)

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={selectedPath}
			title={wireName || ""}
			onUnselect={() => setSelectedPath(context)}
			selectedTab={selectedTab}
			setSelectedTab={setSelectedTab}
			tabs={[
				{ id: "", label: "", icon: "home" },
				{ id: "fields", label: "Fields" },
				{ id: "conditions", label: "Conditions" },
				{ id: "order", label: "Order" },
			]}
		>
			<component.ErrorBoundary definition={{}} path="" context={context}>
				<KeyProp label="Name" path={selectedPath} context={context} />
				<MetadataProp
					metadataType="COLLECTION"
					label="Collection"
					path={selectedPath.addLocal("collection")}
					context={context}
				/>
			</component.ErrorBoundary>
		</PropertiesWrapper>
	)
}

WireProperties.displayName = "WireProperties"

export default WireProperties

import { definition, component, wire } from "@uesio/ui"
import PropertiesWrapper from "../propertieswrapper"
import {
	setSelectedPath,
	useBuilderState,
	useSelectedPath,
} from "../../../../api/stateapi"

import { useDefinition } from "../../../../api/defapi"
import WireHome from "./wirehome"
import { ReactNode } from "react"
import ConditionsProperties from "./conditionsproperties"
import FieldsProperties from "./fieldsproperties"
import OrderProperties from "./orderproperties"

const WireProperties: definition.UtilityComponent = (props) => {
	const { context } = props

	const selectedPath = useSelectedPath(context)

	const wirePath = selectedPath.trimToSize(2)
	const [wireName] = wirePath.pop()

	// This forces a rerender if the definition changes
	useDefinition(wirePath) as wire.WireDefinition

	const [selectedTab, setSelectedTab] = useBuilderState<string>(
		context,
		"wireselectedtab",
		""
	)

	let content: ReactNode = null

	switch (selectedTab) {
		case "fields": {
			content = <FieldsProperties context={context} />
			break
		}
		case "conditions": {
			content = <ConditionsProperties context={context} />
			break
		}
		case "order": {
			content = <OrderProperties context={context} />
			break
		}
		default:
			content = <WireHome context={context} />
	}

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
				{content}
			</component.ErrorBoundary>
		</PropertiesWrapper>
	)
}

WireProperties.displayName = "WireProperties"

export default WireProperties

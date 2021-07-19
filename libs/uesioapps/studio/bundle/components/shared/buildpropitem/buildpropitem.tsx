import { FunctionComponent } from "react"
import { definition, builder, hooks } from "@uesio/ui"
import TextProp from "./textprop"
import SelectProp from "./selectprop"
import KeyProp from "./keyprop"
import WireProp from "./wireprop"
import WiresProp from "./wiresprop"
import MetadataProp from "./metadataprop"
import NumberProp from "./numberprop"
import BooleanProp from "./booleanprop"
import ConditionProp from "./conditionprop"
import NamespaceProp from "./namespaceprop"
import StylesListProp from "./styleslistprop"
import BotProp from "./botprop"

interface Props extends definition.BaseProps {
	descriptor: builder.PropDescriptor
	propsDef: builder.BuildPropertiesDefinition
	setValue: (value: definition.DefinitionValue) => void
	getValue: () => definition.Definition
}

function getPropHandler(type?: string) {
	switch (type) {
		case "METADATA":
			return MetadataProp
		case "SELECT":
			return SelectProp
		case "KEY":
			return KeyProp
		case "WIRE":
			return WireProp
		case "BOT":
			return BotProp
		case "CONDITION":
			return ConditionProp
		case "NAMESPACE":
			return NamespaceProp
		case "WIRES":
			return WiresProp
		case "NUMBER":
			return NumberProp
		case "BOOLEAN":
			return BooleanProp
		case "STYLESLIST":
			return StylesListProp
		case "TEXT":
			return TextProp
		default:
			console.log(`type not recognized in buildPropItem: ${type}`)
			return TextProp
	}
}

const BuildPropItem: FunctionComponent<Props> = (props) => {
	const { descriptor } = props

	const PropHandler = getPropHandler(descriptor.type)

	return <PropHandler {...props} />
}

export default BuildPropItem

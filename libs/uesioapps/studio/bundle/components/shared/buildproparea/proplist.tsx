import { FunctionComponent } from "react"
import { definition, builder, component } from "@uesio/ui"
import { ValueAPI } from "../propertiespaneldefinition"

import TextProp from "../buildpropitem/textprop"
import SelectProp from "../buildpropitem/selectprop"
import KeyProp from "../buildpropitem/keyprop"
import WireProp from "../buildpropitem/wireprop"
import WiresProp from "../buildpropitem/wiresprop"
import MetadataProp from "../buildpropitem/metadataprop"
import NumberProp from "../buildpropitem/numberprop"
import BooleanProp from "../buildpropitem/booleanprop"
import ConditionProp from "../buildpropitem/conditionprop"
import NamespaceProp from "../buildpropitem/namespaceprop"
import StylesListProp from "../buildpropitem/styleslistprop"
import BotProp from "../buildpropitem/botprop"
import ComponentProp from "../buildpropitem/componentprop"

interface Props extends definition.BaseProps {
	properties: builder.PropDescriptor[]
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: ValueAPI
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
		case "COMPONENT":
			return ComponentProp
		default:
			console.log(`type not recognized in buildPropItem: ${type}`)
			return TextProp
	}
}

const PropList: FunctionComponent<Props> = ({
	path,
	propsDef,
	context,
	properties,
	valueAPI,
}) => (
	<>
		{properties.map((descriptor, index) => {
			const newPath =
				descriptor.type === "KEY"
					? path
					: path + '["' + descriptor.name + '"]'

			const key =
				descriptor.type === "KEY"
					? component.path.getParentPath(path || "") + "keyprop"
					: newPath

			const PropHandler = getPropHandler(descriptor.type)
			return (
				<PropHandler
					key={key}
					path={newPath}
					propsDef={propsDef}
					descriptor={descriptor}
					index={index}
					context={context}
					valueAPI={valueAPI}
				/>
			)
		})}
	</>
)

export default PropList

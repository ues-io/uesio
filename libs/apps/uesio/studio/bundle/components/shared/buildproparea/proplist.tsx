import { FunctionComponent } from "react"
import { definition, builder, component } from "@uesio/ui"

import TextProp from "../buildpropitem/textprop"
import TextAreaProp from "../buildpropitem/textareaprop"
import SelectProp from "../buildpropitem/selectprop"
import MultiSelectProp from "../buildpropitem/multiselectprop"
import KeyProp from "../buildpropitem/keyprop"
import WireProp from "../buildpropitem/wireprop"
import WiresProp from "../buildpropitem/wiresprop"
import MetadataProp from "../buildpropitem/metadataprop"
import NumberProp from "../buildpropitem/numberprop"
import ParamProp from "../buildpropitem/paramprop"
import ParamsProp from "../buildpropitem/paramsprop"
import BooleanProp from "../buildpropitem/booleanprop"
import ConditionProp from "../buildpropitem/conditionprop"
import NamespaceProp from "../buildpropitem/namespaceprop"
import BotProp from "../buildpropitem/botprop"
import CustomProp from "../buildpropitem/customprop"
import IconProp from "../buildpropitem/iconprop"
import WireFieldsProp from "../buildpropitem/wirefieldsprop"
import PropListsProp from "../buildpropitem/proplistsprop"

interface Props extends definition.BaseProps {
	properties: builder.PropDescriptor[]
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: builder.ValueAPI
}

function getPropHandler(type?: string) {
	switch (type) {
		case "METADATA":
			return MetadataProp
		case "SELECT":
			return SelectProp
		case "MULTISELECT":
			return MultiSelectProp
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
		case "TEXT":
			return TextProp
		case "TEXT_AREA":
			return TextAreaProp
		case "ICON":
			return IconProp
		case "CUSTOM":
			return CustomProp
		case "PARAM":
			return ParamProp
		case "PARAMS":
			return ParamsProp
		case "WIRE_FIELDS":
			return WireFieldsProp
		case "PROPLISTS":
			return PropListsProp
		default:
			console.log(`type not recognized in buildPropItem: ${type}`)
			return TextProp
	}
}

export const propsToRender = (
	properties: builder.PropDescriptor[],
	conditionValues: definition.DefinitionMap
) =>
	properties.filter((descriptor) => {
		if (!descriptor.display) return true
		return descriptor.display.some((condition) => {
			const { type, property } = condition

			if (!property) {
				console.warn("Displaycondition is missing the property key")
				return true
			}

			const isSet = property in conditionValues
			if (type === "SET") return !isSet
			if (type === "NOT_SET") return !isSet

			const key = conditionValues[property] as definition.DefinitionValue

			if (type === "BLANK") return !key && key !== false
			if (type === "NOT_BLANK") return key === false || !!key
			if (type === "INCLUDES") return condition.values.includes(key)
			if (type === "EQUALS" || !type) return key === condition.value
			if (type === "NOT_EQUALS") return key !== condition.value
			return true
		})
	})

const PropList: FunctionComponent<Props> = (props) => {
	const { path, propsDef, context, properties, valueAPI } = props

	const conditionValues = valueAPI.get(path) as definition.DefinitionMap
	const propertiesToRender = propsToRender(properties, conditionValues)

	return (
		<>
			{propertiesToRender.map((descriptor, index) => {
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
}

export default PropList

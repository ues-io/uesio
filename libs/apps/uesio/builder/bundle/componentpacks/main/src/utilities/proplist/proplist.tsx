import { FunctionComponent } from "react"
import { definition, builder, component } from "@uesio/ui"
import MetadataProp from "../metadataprop/metadataprop"
import SelectProp from "../selectprop/selectprop"
import MultiSelectProp from "../multiselectprop/multiselectprop"
import KeyProp from "../keyprop/keyprop"
import WireProp from "../wireprop/wireprop"
import BotProp from "../botprop/botprop"
import WiresProp from "../wiresprop/wiresprop"
import NamespaceProp from "../namespaceprop/namespaceprop"
import NumberProp from "../numberprop/numberprop"
import BooleanProp from "../booleanprop/booleanprop"
import TextProp from "../textprop/textprop"
import TextAreaProp from "../textareaprop/textareaprop"
import IconProp from "../iconprop/iconprop"
import ParamProp from "../paramprop/paramprop"
import ParamsProp from "../paramsprop/paramsprop"
import FieldProp from "../fieldprop/fieldprop"
import FieldsProp from "../fieldsprop/fieldsprop"
import PropListProp from "../proplistprop/proplistprop"
import ConditionPropComponent from "../conditionprop/conditionprop"
import ProplistsProp from "../proplistsprop/proplistsprop"

interface Props extends definition.UtilityProps {
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
			return ConditionPropComponent
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
		case "PARAM":
			return ParamProp
		case "PARAMS":
			return ParamsProp
		case "FIELD":
			return FieldProp
		case "FIELDS":
			return FieldsProp
		case "PROPLISTS":
			return ProplistsProp
		case "PROPLIST":
			return PropListProp
		default:
			console.log(`type not recognized in buildPropItem: ${type}`)
			return null
	}
}

export const propsToRender = (
	properties: builder.PropDescriptor[],
	conditionValues: definition.DefinitionMap
) =>
	properties.filter((descriptor) => {
		if (!descriptor.display) return true
		return descriptor.display.some((condition) => {
			if (!conditionValues) return false
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
			{propertiesToRender.map((descriptor) => {
				const newPath =
					descriptor.type === "KEY"
						? path
						: path + '["' + descriptor.name + '"]'

				const key =
					descriptor.type === "KEY"
						? component.path.getParentPath(path || "") + "keyprop"
						: newPath

				const PropHandler = getPropHandler(descriptor.type)

				console.log(PropHandler, key, propsDef, context)
				return null
				/*
				return (
					PropHandler && (
						<PropHandler
							key={key}
							path={newPath}
							propsDef={propsDef}
							descriptor={descriptor}
							//index={index}
							context={context}
							valueAPI={valueAPI}
						/>
					)
				)
				*/
			})}
		</>
	)
}

export default PropList

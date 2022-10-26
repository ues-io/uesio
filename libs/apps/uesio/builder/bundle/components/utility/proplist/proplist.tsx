import { FunctionComponent } from "react"
import { definition, builder, component } from "@uesio/ui"

const TextProp = component.getUtility("uesio/builder.textprop")
const TextAreaProp = component.getUtility("uesio/builder.textareaprop")
const SelectProp = component.getUtility("uesio/builder.selectprop")
const MultiSelectProp = component.getUtility("uesio/builder.multiselectprop")
const KeyProp = component.getUtility("uesio/builder.keyprop")
const WireProp = component.getUtility("uesio/builder.wireprop")
const WiresProp = component.getUtility("uesio/builder.wiresprop")
const MetadataProp = component.getUtility("uesio/builder.metadataprop")
const NumberProp = component.getUtility("uesio/builder.numberprop")
const ParamProp = component.getUtility("uesio/builder.paramprop")
const ParamsProp = component.getUtility("uesio/builder.paramsprop")
const BooleanProp = component.getUtility("uesio/builder.booleanprop")
const ConditionProp = component.getUtility("uesio/builder.conditionprop")
const NamespaceProp = component.getUtility("uesio/builder.namespaceprop")
const BotProp = component.getUtility("uesio/builder.botprop")
const CustomProp = component.getUtility("uesio/builder.customprop")
const IconProp = component.getUtility("uesio/builder.iconprop")
const FieldProp = component.getUtility("uesio/builder.fieldprop")
const FieldsProp = component.getUtility("uesio/builder.fieldsprop")
const PropListsProp = component.getUtility("uesio/builder.proplistsprop")
const PropListProp = component.getUtility("uesio/builder.proplistprop")

interface Props extends definition.BaseProps {
	properties?: builder.PropDescriptor[]
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
		case "FIELD":
			return FieldProp
		case "FIELDS":
			return FieldsProp
		case "PROPLISTS":
			return PropListsProp
		case "PROPLIST":
			return PropListProp
		default:
			console.log(`type not recognized in buildPropItem: ${type}`)
			return null
	}
}

export const propsToRender = (
	properties: builder.PropDescriptor[] | undefined,
	conditionValues: definition.DefinitionMap
) =>
	properties?.filter((descriptor) => {
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
			{propertiesToRender?.map((descriptor, index) => {
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
					PropHandler && (
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
				)
			})}
		</>
	)
}

export default PropList

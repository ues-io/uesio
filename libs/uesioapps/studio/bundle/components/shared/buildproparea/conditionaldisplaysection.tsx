import { FC, useState } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { builder, component } from "@uesio/ui"
import PropList from "./proplist"
import PropNodeTag from "../buildpropitem/propnodetag"

const SelectField = component.registry.getUtility("io.selectfield")
const FieldLabel = component.registry.getUtility("io.fieldlabel")
const TextField = component.registry.getUtility("io.textfield")

//    - field: studio.type
// 		value: "REFERENCE"

//   - type: paramIsValue
//     param: step
//     value: "1"

const ConditionalDisplaySection: FC<SectionRendererProps> = (props) => {
	const { path, context, propsDef, valueAPI } = props
	const section = props.section as builder.PropListSection

	const properties: builder.PropDescriptor[] = [
		{
			name: "uesio.display",
			type: "CONDITIONALDISPLAY",
			label: "Conditional Display",
		},
	]

	const onClick = () => {
		console.log("click")
	}

	const comparisonOperators = ["=", "<", ">", "!="]

	const [selectedField, setSelectedField] = useState<string>("")
	const [comparisonOperator, setComparisonOperator] = useState<string>("")
	const [compareValue, setCompareValue] = useState<string>("")
	const availableFields = [
		{
			label: "crm.name",
			value: "crm.name",
		},
		{
			label: "crm.externalid",
			value: "crm.externalid",
		},
	]
	const updateDefinition = (field: string, value: string) => {
		valueAPI.add(`${path}["uesio.display"]`, {
			field,
			value,
		})
	}

	return (
		<>
			{/* <ExpandPanel
			defaultExpanded={false}
			title={section.title}
			context={context}
		> */}

			{/* // </ExpandPanel> */}
			<pre>{JSON.stringify(path, null, 2)}</pre>
			<SelectField
				context={context}
				label={"Field"}
				value={selectedField}
				options={availableFields}
				setValue={(value: string) => setSelectedField(value)}
			/>
			<SelectField
				context={context}
				label={""}
				value={comparisonOperator}
				options={comparisonOperators.map((x) => ({
					value: x,
					label: x,
				}))}
				setValue={(value: string) => setComparisonOperator(value)}
			/>
			<TextField
				value={compareValue}
				label={"Compare value"}
				setValue={(value: string): void => setCompareValue(value)}
				context={context}
			/>
			<button
				onClick={() => updateDefinition(selectedField, compareValue)}
			>
				submit
			</button>
		</>
	)
}

export default ConditionalDisplaySection

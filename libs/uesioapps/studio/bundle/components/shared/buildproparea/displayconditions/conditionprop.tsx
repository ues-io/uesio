import React, { FC } from "react"
import { builder, definition, component } from "@uesio/ui"

type IParamIsSet = {
	type: "paramIsSet"
	param: string
}
type IParamIsValue = {
	type: "paramIsValue"
	param: string
	value: string
}
type IFieldIsValue = {
	type: "fieldIsValue"
	field: string
	value: string
}
export type Condition = IParamIsSet | IParamIsValue | IFieldIsValue

interface Y<T> extends definition.BaseProps {
	condition: T
	valueAPI: builder.ValueAPI
}

const SelectField = component.registry.getUtility("io.selectfield")
const TextField = component.registry.getUtility("io.textfield")

interface T extends definition.BaseProps {
	condition: Condition
	index: number
	valueAPI: builder.ValueAPI
	className: string
}

const TypeSelector: FC<Y<Condition>> = (props) => {
	const options = [
		{ label: "Param equals", value: "paramIsValue" },
		{ label: "Field equals", value: "fieldIsValue" },
		{ label: "Param is set", value: "paramIsSet" },
	]
	return (
		<SelectField
			context={props.context}
			label={"Type"}
			value={props.condition.type}
			options={options}
			setValue={(val: string) =>
				props.valueAPI.set(`${props.path}['type']`, val)
			}
		/>
	)
}

const ParamIsSet = (props: Y<IParamIsSet>) => {
	const params = [
		{
			label: "crm.name",
			value: "crm.name",
		},
		{
			label: "crm.externalid",
			value: "crm.externalid",
		},
	]

	return (
		<div>
			<p>Param Is Set</p>
			<SelectField
				context={props.context}
				label={"Param"}
				value={props.condition.param}
				options={params}
				setValue={(val: string) =>
					props.valueAPI.set(`${props.path}['param']`, val)
				}
			/>
		</div>
	)
}

// Reused in condition props
const ValueChecker: FC<ValueCheckProps> = (props) => (
	<div>
		<SelectField
			context={props.context}
			label={props.type}
			value={props.a}
			options={props.options}
			setValue={(val: string) => props.setVal(props.type, val)}
		/>

		<TextField
			value={props.b}
			label={"Compare value"}
			setValue={(val: string) => props.setVal("value", val)}
			context={props.context}
		/>
	</div>
)

const ParamIsValue = (props: Y<IParamIsValue>) => {
	const options = [
		{
			label: "crm.name",
			value: "crm.name",
		},
		{
			label: "crm.externalid",
			value: "crm.externalid",
		},
	]

	const setVal = (key: "field" | "param" | "value", value: string) =>
		props.valueAPI.set(`${props.path}[${key}]`, value)

	const { param, value } = props.condition

	return (
		<div>
			<ValueChecker
				options={options}
				a={param}
				b={value}
				type="param"
				setVal={setVal}
				context={props.context}
			/>
		</div>
	)
}
interface ValueCheckProps extends definition.BaseProps {
	options: { label: string; value: string }[]
	a: string
	b: string
	type: "field" | "param"
	setVal: (key: "field" | "param" | "value", value: string) => void
}

/* TODO: have dropdown of available fields like fieldhints */
/**
 *
 * @yaml field: studio.type, value: "REFERENCE"
 */
const FieldIsValue = (props: Y<IFieldIsValue>) => {
	// as seen in YAML:
	//    -  type:
	//   field: studio.type
	// 		value: "REFERENCE"

	const options = [
		{
			label: "crm.name",
			value: "crm.name",
		},
		{
			label: "crm.externalid",
			value: "crm.externalid",
		},
	]

	const { field, value } = props.condition

	const setVal = (key: "field" | "param" | "value", value: string) =>
		props.valueAPI.set(`${props.path}[${key}]`, value)

	return (
		<ValueChecker
			options={options}
			a={field}
			b={value}
			type="field"
			setVal={setVal}
			context={props.context}
		/>
	)
}

const getConditionPropComponent = (props: Y<Condition>) => {
	const type = props.condition.type
	if (!type || type === "fieldIsValue")
		return <FieldIsValue {...(props as Y<IFieldIsValue>)} />
	if (type === "paramIsValue")
		return <ParamIsValue {...(props as Y<IParamIsValue>)} />
	if (type === "paramIsSet")
		return <ParamIsSet {...(props as Y<IParamIsSet>)} />
}

const ConditionProp: FC<T> = ({
	context,
	path,
	index,
	valueAPI,
	className,
	condition,
}) => {
	const conditionProps = {
		context,
		condition,
		path: `${path}["uesio.display"][${index}]`,
		valueAPI,
		className,
	}
	return (
		<div className={className}>
			<TypeSelector {...conditionProps} />
			{getConditionPropComponent(conditionProps)}
		</div>
	)
}

export default ConditionProp

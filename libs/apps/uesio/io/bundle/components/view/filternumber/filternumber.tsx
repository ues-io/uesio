import { FC } from "react"

import { Props } from "./filternumberdefinition"
import { component, hooks, wire } from "@uesio/ui"

const TextField = component.getUtility("uesio/io.textfield")

type Operator = "EQ" | "LT" | "GT"

const FilterNumber: FC<Props> = (props) => {
	const { context, definition, wire, path = "" } = props
	const uesio = hooks.useUesio(props)
	const isRange = definition?.type === "range"
	const firstFieldOperator = isRange ? "GT" : "EQ"

	const onChange = (value: number | null, operator: Operator) => {
		const id = props.path + `["${operator}"]`
		const signals = [
			value || value === 0
				? {
						signal: "wire/SET_CONDITION",
						wire: definition.wire,
						condition: {
							field: definition.field,
							value: operator === "GT" ? value - 1 : value,
							active: true,
							id,
							operator,
						},
				  }
				: {
						signal: "wire/REMOVE_CONDITION",
						wire: definition.wire,
						conditionId: id,
				  },
			{
				signal: "wire/LOAD",
				wires: [definition.wire],
			},
		]
		uesio.signal.runMany(signals, context)
	}

	const getDisplayValue = (operator: Operator) => {
		const value = (
			wire.getCondition(
				path + `["${operator}"]`
			) as wire.ValueConditionState | null
		)?.value
		if (!value) return ""
		const options = {
			GT: Number(value) + 1,
			LT: Number(value) - 1,
			EQ: value,
		}
		return String(options[operator])
	}

	return (
		<div>
			{/* Single point or lower bound */}
			<TextField
				value={getDisplayValue(firstFieldOperator)}
				setValue={(value: number | null): void =>
					// We need to adjust the value for GT: when 5 is selected, we mean greater than 4
					onChange(
						value && firstFieldOperator === "GT"
							? value - 1
							: value,
						firstFieldOperator
					)
				}
				context={context}
				variant="uesio/io.textfield:uesio/studio.propfield"
			/>

			{/* Upper bound */}
			{isRange && (
				<TextField
					value={getDisplayValue("LT")}
					setValue={(value: number | null): void =>
						onChange(value ? Number(value) + 1 : value, "LT")
					}
					context={context}
					variant="uesio/io.textfield:uesio/studio.propfield"
				/>
			)}
		</div>
	)
}

export default FilterNumber

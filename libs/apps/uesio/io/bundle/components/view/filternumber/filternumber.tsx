import { FC } from "react"

import { Props } from "./filternumberdefinition"
import { component, hooks, wire } from "@uesio/ui"

const TextField = component.getUtility("uesio/io.textfield")

type Operator = "EQ" | "LT" | "GT"

const Filter: FC<Props> = (props) => {
	const { context, definition, wire, path = "" } = props
	const uesio = hooks.useUesio(props)
	const isRange = definition.point === "range"
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
							value,
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

	const getValue = (operator: Operator) => {
		const condition = wire.getCondition(
			path + `["${operator}"]`
		) as wire.ValueConditionState | null
		if (!condition) return ""
		return condition.value
	}

	return (
		<div>
			<TextField
				value={getValue(firstFieldOperator)}
				setValue={(value: number | null): void =>
					onChange(value, firstFieldOperator)
				}
				context={context}
				variant="uesio/io.textfield:uesio/studio.propfield"
			/>

			{definition.point === "range" && (
				<TextField
					value={getValue("LT")}
					setValue={(value: number | null): void =>
						onChange(value, "LT")
					}
					context={context}
					variant="uesio/io.textfield:uesio/studio.propfield"
				/>
			)}
		</div>
	)
}

export default Filter

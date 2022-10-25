import { FC, useState, useEffect } from "react"

import { Props } from "./filternumberdefinition"
import { component, hooks, wire } from "@uesio/ui"
import debounce from "lodash/debounce"

const TextField = component.getUtility("uesio/io.textfield")

type Operator = "EQ" | "NOT_EQ" | "LT" | "GT" | "GTE" | "LTE"

const FilterNumber: FC<Props> = (props) => {
	const { context, definition, wire, path = "" } = props
	const uesio = hooks.useUesio(props)
	const operator = definition?.operator as Operator
	const [value, setValue] = useState<number | null>(
		Number(
			(
				wire.getCondition(
					path + `["${operator}"]`
				) as wire.ValueConditionState | null
			)?.value
		)
	)

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
	const debouncedRequest = debounce(onChange, 250)

	useEffect(() => {
		debouncedRequest(value, operator)
	}, [value])

	return (
		<TextField
			value={value}
			setValue={(value: number | null): void => setValue(value)}
			context={context}
			variant="uesio/io.textfield:uesio/studio.propfield"
		/>
	)
}

export default FilterNumber

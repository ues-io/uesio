import { definition, api, wire } from "@uesio/ui"
import CheckboxField from "../field/checkbox"
import ToggleField from "../field/toggle"
import IconButton from "../iconbutton/iconbutton"

interface CheckboxFilterProps {
	path: string
	wire: wire.Wire
	condition: wire.ValueConditionState
	displayAs?: string
}

const CheckboxFilter: definition.UtilityComponent<CheckboxFilterProps> = (
	props
) => {
	const { wire, context, displayAs, condition } = props
	const wireId = wire.getId()

	return displayAs === "TOGGLE" ? (
		<div className="flex">
			<ToggleField
				context={context}
				variant={"uesio/io.filter"}
				value={
					condition.value !== (null || undefined)
						? condition.value
						: null
				}
				setValue={(value: boolean) => {
					api.signal.runMany(
						[
							{
								signal: "wire/SET_CONDITION",
								wire: wireId,
								condition: {
									...condition,
									value,
									inactive: false,
								},
							},
							{
								signal: "wire/LOAD",
								wires: [wireId],
							},
						],
						context
					)
				}}
			/>
			{condition.value !== (null || undefined) ? (
				<IconButton
					label="cancel"
					icon="cancel"
					className="ml-3"
					context={context}
					onClick={() => {
						api.signal.runMany(
							[
								{
									signal: "wire/REMOVE_CONDITION",
									wire: wireId,
									conditionId: condition.id,
								},
								{
									signal: "wire/LOAD",
									wires: [wireId],
								},
							],
							context
						)
					}}
				/>
			) : undefined}
		</div>
	) : (
		<div className="flex">
			<CheckboxField
				context={context}
				variant={"uesio/io.filter"}
				value={
					condition.value !== (null || undefined)
						? condition.value
						: null
				}
				setValue={(value: boolean) => {
					api.signal.runMany(
						[
							{
								signal: "wire/SET_CONDITION",
								wire: wireId,
								condition: {
									...condition,
									value,
									inactive: false,
								},
							},
							{
								signal: "wire/LOAD",
								wires: [wireId],
							},
						],
						context
					)
				}}
			/>
			{condition.value !== (null || undefined) ? (
				<IconButton
					label="cancel"
					icon="cancel"
					className="ml-3"
					context={context}
					onClick={() => {
						api.signal.runMany(
							[
								{
									signal: "wire/REMOVE_CONDITION",
									wire: wireId,
									conditionId: condition.id,
								},
								{
									signal: "wire/LOAD",
									wires: [wireId],
								},
							],
							context
						)
					}}
				/>
			) : undefined}
		</div>
	)
}

export default CheckboxFilter

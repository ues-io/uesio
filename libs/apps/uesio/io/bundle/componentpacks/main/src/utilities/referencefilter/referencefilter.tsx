import { FunctionComponent } from "react"
import { definition, api, wire, collection } from "@uesio/ui"
import ReferenceField, { ReferenceFieldOptions } from "../field/reference"
import UserField, { UserFieldOptions } from "../field/user"

interface ReferenceFilterProps extends definition.UtilityProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
	reference?: ReferenceFieldOptions
	userreference?: UserFieldOptions
}

const ReferenceFilter: FunctionComponent<ReferenceFilterProps> = (props) => {
	const {
		wire,
		fieldMetadata,
		context,
		condition,
		reference,
		userreference,
		path,
	} = props
	const wireId = wire.getId()
	return fieldMetadata.getType() === "REFERENCE" ? (
		<ReferenceField
			path={path}
			mode={"EDIT"}
			fieldId={fieldMetadata.getId()}
			fieldMetadata={fieldMetadata}
			context={context}
			variant={"uesio/io.filter"}
			options={reference}
			setValue={(value: string) => {
				api.signal.runMany(
					[
						{
							signal: "wire/SET_CONDITION",
							wire: wireId,
							condition: {
								...condition,
								value,
								inactive: value === null,
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
	) : (
		<UserField
			path={path}
			mode={"EDIT"}
			fieldId={fieldMetadata.getId()}
			fieldMetadata={fieldMetadata}
			context={context}
			variant={"uesio/io.filter"}
			options={userreference}
			setValue={(value: string) => {
				api.signal.runMany(
					[
						{
							signal: "wire/SET_CONDITION",
							wire: wireId,
							condition: {
								...condition,
								value,
								inactive: value === null,
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
	)
}

export default ReferenceFilter

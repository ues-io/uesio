import { FunctionComponent } from "react"
import {
	definition,
	styles,
	context,
	collection,
	wire,
	component,
} from "@uesio/ui"

interface UserFieldProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	mode: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
}

const Tile = component.registry.getUtility("io.tile")
const Avatar = component.registry.getUtility("io.avatar")
const ReferenceField = component.registry.getUtility("io.referencefield")

const UserField: FunctionComponent<UserFieldProps> = (props) => {
	const { mode, record, fieldMetadata, context } = props
	const readonly = mode === "READ"
	const fieldId = fieldMetadata.getId()
	const user = record.getFieldValue<wire.PlainWireRecord | undefined>(fieldId)
	const firstName = user?.["uesio.firstname"] as string
	const lastName = user?.["uesio.lastname"] as string
	const picture = user?.["uesio.picture"] as wire.PlainWireRecord | undefined
	const classes = styles.useUtilityStyles(
		{
			input: {},
			readonly: {},
		},
		props
	)

	if (!readonly) {
		return <ReferenceField {...props} />
	}

	if (!user) return null

	return (
		<Tile
			avatar={
				<Avatar
					image={picture?.["uesio.id"]}
					text={firstName.charAt(0) + lastName.charAt(0)}
					context={context}
				/>
			}
			context={context}
		>
			{`${firstName} ${lastName}`}
		</Tile>
	)
}

export default UserField

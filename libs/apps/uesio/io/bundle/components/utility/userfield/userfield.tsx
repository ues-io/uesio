import { FunctionComponent } from "react"
import { definition, context, collection, wire, component } from "@uesio/ui"

interface UserFieldProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	fieldId: string
	mode: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
}

const Tile = component.getUtility("uesio/io.tile")
const Avatar = component.getUtility("uesio/io.avatar")
const ReferenceField = component.getUtility("uesio/io.referencefield")

const UserField: FunctionComponent<UserFieldProps> = (props) => {
	const { mode, record, fieldId, context } = props
	const readonly = mode === "READ"

	const user = record.getFieldValue<wire.PlainWireRecord>(fieldId)
	const firstName = user?.["uesio/core.firstname"] as string
	const lastName = user?.["uesio/core.lastname"] as string

	if (!readonly) {
		return <ReferenceField {...props} />
	}

	if (!user) return null

	const uniquekey = user?.[collection.UNIQUE_KEY_FIELD] as string

	const initials =
		firstName && lastName
			? firstName.charAt(0) + lastName.charAt(0)
			: uniquekey.charAt(0)

	const fullName =
		firstName && lastName ? `${firstName} ${lastName}` : uniquekey

	return (
		<Tile
			avatar={
				<Avatar
					image={`$UserFile{uesio/core.picture}`}
					text={initials}
					context={context.addFrame({
						recordData: user,
					})}
				/>
			}
			context={context}
		>
			{fullName}
		</Tile>
	)
}

export default UserField

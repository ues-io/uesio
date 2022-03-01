import { FunctionComponent } from "react"
import { definition, context, collection, wire, component } from "@uesio/ui"

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

	if (!readonly) {
		return <ReferenceField {...props} />
	}

	if (!user) return null

	const initials =
		firstName && lastName ? firstName.charAt(0) + lastName.charAt(0) : "?"

	const fullName =
		firstName && lastName ? `${firstName} ${lastName}` : user?.["uesio.id"]

	return (
		<Tile
			avatar={
				<Avatar
					image={`$UserFile{${picture?.["uesio.id"]}}`}
					text={initials}
					context={context}
				/>
			}
			context={context}
		>
			{fullName}
		</Tile>
	)
}

export default UserField

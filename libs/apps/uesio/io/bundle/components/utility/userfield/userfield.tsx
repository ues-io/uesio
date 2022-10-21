import { FunctionComponent } from "react"
import {
	definition,
	context,
	collection,
	wire,
	component,
	hooks,
} from "@uesio/ui"
import { UserFieldOptions } from "../../view/field/fielddefinition"

interface UserFieldProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	fieldId: string
	mode: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
	options?: UserFieldOptions
}

const Tile = component.getUtility("uesio/io.tile")
const TitleBar = component.getUtility("uesio/io.titlebar")
const Avatar = component.getUtility("uesio/io.avatar")
const ReferenceField = component.getUtility("uesio/io.referencefield")

const UserField: FunctionComponent<UserFieldProps> = (props) => {
	const { mode, record, fieldId, context, options } = props
	const readonly = mode === "READ"

	const uesio = hooks.useUesio(props)

	if (!readonly) {
		return <ReferenceField {...props} />
	}

	const user = record.getReferenceValue(fieldId)

	if (!user) return null

	const firstName = user.getFieldValue<string>("uesio/core.firstname")
	const lastName = user.getFieldValue<string>("uesio/core.lastname")

	const uniquekey = user.getUniqueKey()
	const picture = user.getReferenceValue("uesio/core.picture")

	const initials =
		firstName && lastName
			? firstName.charAt(0) + lastName.charAt(0)
			: uniquekey?.charAt(0)

	const fullName =
		firstName && lastName ? `${firstName} ${lastName}` : uniquekey

	const fileURL = uesio.file.getUserFileURL(
		context,
		picture?.getIdFieldValue()
	)

	return (
		<Tile
			avatar={
				<Avatar image={fileURL} text={initials} context={context} />
			}
			context={context}
		>
			<TitleBar
				variant="uesio/io.infotag"
				title={fullName}
				subtitle={options?.subtitle}
				context={context}
			/>
		</Tile>
	)
}

export default UserField

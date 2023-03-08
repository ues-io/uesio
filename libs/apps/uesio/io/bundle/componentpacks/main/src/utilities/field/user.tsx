import { FunctionComponent } from "react"
import { definition, context as ctx, collection, wire, api } from "@uesio/ui"
import ReferenceField from "./reference"
import Tile from "../tile/tile"
import Avatar from "../avatar/avatar"
import TitleBar from "../titlebar/titlebar"

export type UserFieldOptions = {
	subtitle?: string
}

interface UserFieldProps extends definition.UtilityProps {
	path: string
	fieldMetadata: collection.Field
	fieldId: string
	mode: ctx.FieldMode
	record: wire.WireRecord
	options?: UserFieldOptions
}

const UserField: FunctionComponent<UserFieldProps> = (props) => {
	const { mode, record, fieldId, context, options } = props
	const readonly = mode === "READ"

	if (!readonly) {
		return <ReferenceField {...props} options={{}} />
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

	const fileURL = api.file.getUserFileURL(
		context.getWorkspace() ? new ctx.Context() : context,
		picture?.getIdFieldValue(),
		picture?.getFieldValue<string>(collection.UPDATED_AT_FIELD)
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

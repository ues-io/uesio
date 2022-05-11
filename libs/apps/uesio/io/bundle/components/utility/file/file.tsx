import { FunctionComponent } from "react"
import {
	definition,
	styles,
	collection,
	component,
	context,
	wire,
	hooks,
} from "@uesio/ui"

interface FileUtilityProps extends definition.UtilityProps {
	width?: string
	fieldMetadata: collection.Field
	fieldId: string
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
}

const Icon = component.registry.getUtility("uesio/io.icon")
const Button = component.registry.getUtility("uesio/io.button")

const File: FunctionComponent<FileUtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldId, record, context } = props

	const view = context.getView()
	const appName = view?.params?.app
	const workspaceName = view?.params?.workspacename
	const newContext =
		!appName || !workspaceName
			? props.context
			: context.addFrame({
					workspace: {
						name: workspaceName,
						app: appName,
					},
			  })

	const userFile = record.getFieldValue<wire.PlainWireRecord | undefined>(
		fieldId
	)
	const userFileId = userFile?.[collection.ID_FIELD] as string
	const fileUrl = uesio.file.getUserFileURL(newContext, userFileId, true)

	const classes = styles.useUtilityStyles(
		{
			root: {
				textDecoration: "none",
			},
		},
		props
	)

	return (
		<a href={fileUrl} className={classes.root}>
			<Button
				icon={<Icon icon="file_download" context={newContext} />}
				context={newContext}
				label={"Download"}
				variant="uesio/io.secondary"
			/>
		</a>
	)
}

export default File

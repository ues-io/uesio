import { api, styles, context, definition } from "@uesio/ui"
import MarkDownField from "../../utilities/markdownfield/markdownfield"

type MarkDownDefinition = {
	file?: string
	markdown?: string
	mode: context.FieldMode
}

const MarkDown: definition.UC<MarkDownDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	const fileContent = api.file.useFile(context, definition.file)

	return (
		<MarkDownField
			classes={classes}
			variant={definition["uesio.variant"]}
			context={context}
			value={fileContent || ""}
			mode={"READ"}
		/>
	)
}

export default MarkDown

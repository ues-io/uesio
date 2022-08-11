import { FunctionComponent } from "react"

import { MarkDownProps } from "./markdowndefinition"
import { component, styles } from "@uesio/ui"
import { MarkDownFieldProps } from "../../utility/markdownfield/markdownfield"

const MarkDownField = component.getUtility<MarkDownFieldProps>(
	"uesio/io.markdownfield"
)

const MarkDown: FunctionComponent<MarkDownProps> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)

	return (
		<MarkDownField
			classes={classes}
			variant={definition["uesio.variant"]}
			context={context}
			value={definition.markdown || ""}
			mode={"READ"}
		/>
	)
}

export default MarkDown

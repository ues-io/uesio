import { FC } from "react"
import { definition, styles, component } from "@uesio/ui"
import Form from "./form"
import { FormProps } from "./formdefinition"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const ColumnBuilder: FC<FormProps> = (props) => {
	const { path = "", context } = props

	// Get template val set on parent layout def

	const classes = styles.useStyles(
		{
			root: {},
			header: {
				display: "none",
			},
		},
		{
			context: props.context,
		}
	)

	return (
		<BuildWrapper {...props} classes={classes}>
			<Form {...props} />
			<button>+</button>
		</BuildWrapper>
	)
}

export default ColumnBuilder

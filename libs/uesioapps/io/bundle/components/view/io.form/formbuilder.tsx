import { FC } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"
import Form from "./form"
import { FormProps } from "./formdefinition"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const ColumnBuilder: FC<FormProps> = (props) => {
	const { path = "", context } = props
	const uesio = hooks.useUesio(props)

	const wire = context.getWire()
	// if(!wire) {

	// }

	const classes = styles.useStyles(
		{
			root: {},
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

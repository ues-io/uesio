import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"

interface FieldWrapperUtilityProps extends definition.UtilityProps {
	label?: string
	labelPosition?: string
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")

const Text: FunctionComponent<FieldWrapperUtilityProps> = (props) => {
	const { label, labelPosition, children, context } = props
	const classes = styles.useUtilityStyles(
		{
			root: {},
		},
		props
	)
	if (labelPosition === "none") {
		return <>{children}</>
	}

	return (
		<div className={classes.root}>
			<FieldLabel label={label} context={context} />
			{children}
		</div>
	)
}

export default Text

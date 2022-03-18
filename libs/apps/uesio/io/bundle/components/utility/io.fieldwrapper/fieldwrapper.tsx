import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"
import { LabelPosition } from "../../view/io.field/fielddefinition"

interface FieldWrapperUtilityProps extends definition.UtilityProps {
	label?: string
	labelPosition?: LabelPosition
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")

const Text: FunctionComponent<FieldWrapperUtilityProps> = (props) => {
	const { label, labelPosition, children, context } = props
	const classes = styles.useUtilityStyles(
		{
			root: {},
			labelTop: {},
			labelLeft: {},
			label: {},
		},
		props
	)
	if (labelPosition === "none") {
		return <>{children}</>
	}

	return (
		<div
			className={styles.cx(
				classes.root,
				(labelPosition === "top" || !labelPosition) && classes.labelTop,
				labelPosition === "left" && classes.labelLeft
			)}
		>
			<FieldLabel
				classes={{ root: classes.label }}
				label={label}
				context={context}
			/>
			{children}
		</div>
	)
}

export default Text

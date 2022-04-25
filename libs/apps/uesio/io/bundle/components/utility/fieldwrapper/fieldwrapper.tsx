import { FunctionComponent } from "react"
import { definition, styles, component, wire } from "@uesio/ui"
import { LabelPosition } from "../../view/field/fielddefinition"

interface FieldWrapperUtilityProps extends definition.UtilityProps {
	label?: string
	labelPosition?: LabelPosition
	wire: wire.Wire
	fieldId: string
}
const Icon = component.registry.getUtility("uesio/io.icon")
const FieldLabel = component.registry.getUtility("uesio/io.fieldlabel")

const Text: FunctionComponent<FieldWrapperUtilityProps> = (props) => {
	const { label, labelPosition, children, context, wire, fieldId } = props
	const classes = styles.useUtilityStyles(
		{
			root: {},
			labelTop: {},
			labelLeft: {},
			label: {},
			error: {
				color: "#ff4545",
				fontStyle: "italic",
				fontSize: "0.95em",
				marginTop: "5px",
			},
		},
		props
	)
	if (labelPosition === "none") {
		return <>{children}</>
	}

	// Only show first error
	const error = Object.values(wire.getErrors() || {})
		.flat()
		.find((err) => err.fieldid === fieldId)

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

			{/* Error */}
			{error && (
				<div className={classes.error}>
					<Icon icon="error_outline" context={props.context} />{" "}
					{error.message}
				</div>
			)}
		</div>
	)
}

export default Text

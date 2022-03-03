import { FunctionComponent } from "react"
import { definition, styles, component, wire } from "@uesio/ui"
import { LabelPosition } from "../../view/io.field/fielddefinition"

interface FieldWrapperUtilityProps extends definition.UtilityProps {
	label?: string
	labelPosition?: LabelPosition
	error: wire.WireError
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")
const Icon = component.registry.getUtility("io.icon")

const Text: FunctionComponent<FieldWrapperUtilityProps> = (props) => {
	const { label, labelPosition, children, context, error } = props
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
			{error && (
				<div className={classes.error}>
					<Icon icon="error_outline" context={props.context} />
					{error.message}
				</div>
			)}
		</div>
	)
}

export default Text

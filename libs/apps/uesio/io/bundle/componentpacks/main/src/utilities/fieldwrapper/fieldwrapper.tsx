import { FunctionComponent } from "react"
import { definition, styles, component, wire } from "@uesio/ui"
import { LabelPosition } from "../../components/field/field"

interface FieldWrapperUtilityProps extends definition.UtilityProps {
	label?: string
	labelPosition?: LabelPosition
	errors?: wire.SaveError[]
}
const Icon = component.getUtility("uesio/io.icon")
const FieldLabel = component.getUtility("uesio/io.fieldlabel")

const Text: FunctionComponent<FieldWrapperUtilityProps> = (props) => {
	const { label, labelPosition, children, context, errors } = props
	const classes = styles.useUtilityStyles(
		{
			root: {},
			labelTop: {},
			labelLeft: {},
			label: {},
			errorwrapper: {},
			erroricon: {},
			error: {},
		},
		props
	)

	return (
		<div
			className={styles.cx(
				classes.root,
				(labelPosition === "top" || !labelPosition) && classes.labelTop,
				labelPosition === "left" && classes.labelLeft
			)}
		>
			{labelPosition !== "none" && (
				<FieldLabel
					classes={{ root: classes.label }}
					label={label}
					context={context}
				/>
			)}

			{children}

			{errors?.map((error) => (
				<div
					className={classes.errorwrapper}
					key={error.recordid + ":" + error.fieldid}
				>
					<Icon
						icon="error_outline"
						context={props.context}
						className={classes.erroricon}
					/>
					<div className={classes.error}>{error.message}</div>
				</div>
			))}
		</div>
	)
}

export default Text

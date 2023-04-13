import { FunctionComponent } from "react"
import { definition, styles, wire } from "@uesio/ui"
import { LabelPosition } from "../../components/field/field"
import FieldLabel from "../fieldlabel/fieldlabel"
import Icon from "../icon/icon"

interface FieldWrapperUtilityProps extends definition.UtilityProps {
	label?: string
	labelPosition?: LabelPosition
	errors?: wire.SaveError[]
}

const FieldWrapper: FunctionComponent<FieldWrapperUtilityProps> = (props) => {
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
		props,
		"uesio/io.fieldwrapper"
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

export default FieldWrapper

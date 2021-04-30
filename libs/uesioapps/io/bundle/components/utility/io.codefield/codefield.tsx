import { FunctionComponent } from "react"
import { definition, styles, context, collection } from "@uesio/ui"
import LazyMonaco from "@uesio/lazymonaco"

interface CodeFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
}

const CodeField: FunctionComponent<CodeFieldProps> = (props) => {
	const { setValue, value, mode } = props
	const readonly = mode === "READ"
	const width = props.definition?.width as string
	const classes = styles.useStyles(
		{
			root: {
				...(width && { width }),
			},
			label: {},
			input: {
				height: "320px",
			},
			readonly: {},
		},
		props
	)

	return (
		<div className={classes.root}>
			<div className={classes.label}>{props.label}</div>
			<div className={classes.input}>
				<LazyMonaco
					value={value}
					options={{
						scrollBeyondLastLine: false,
						automaticLayout: true,
						minimap: {
							enabled: false,
						},
					}}
					language={"javascript"}
					onChange={setValue}
				/>
			</div>
		</div>
	)
}

export default CodeField

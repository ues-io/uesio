import { FunctionComponent } from "react"
import { definition, styles, context } from "@uesio/ui"
import LazyMonaco from "@uesio/lazymonaco"

interface CodeFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	hideLabel?: boolean
	language?: string
	mode?: context.FieldMode
}

const CodeField: FunctionComponent<CodeFieldProps> = (props) => {
	const { setValue, value, mode, language } = props
	const readonly = mode === "READ"
	const width = props.definition?.width as string
	const classes = styles.useUtilityStyles(
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
					language={language || "javascript"}
					onChange={setValue}
				/>
			</div>
		</div>
	)
}

export default CodeField

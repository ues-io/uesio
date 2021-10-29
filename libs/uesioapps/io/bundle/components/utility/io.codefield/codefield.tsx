import { FunctionComponent } from "react"
import { definition, styles, context, component } from "@uesio/ui"
import LazyMonaco from "@uesio/lazymonaco"

interface CodeFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	hideLabel?: boolean
	language?: string
	mode?: context.FieldMode
	lineNumbers?: "on" | "off"
	lineNumbersMinChars?: number
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")

const CodeField: FunctionComponent<CodeFieldProps> = (props) => {
	const {
		setValue,
		value,
		mode,
		language,
		context,
		hideLabel,
		label,
		lineNumbers,
		lineNumbersMinChars,
	} = props
	const classes = styles.useUtilityStyles(
		{
			root: {},
			input: {
				height: "320px",
			},
			readonly: {},
		},
		props
	)

	return (
		<div className={classes.root}>
			<FieldLabel label={label} hide={hideLabel} context={context} />
			<div className={classes.input}>
				<LazyMonaco
					value={value}
					options={{
						scrollBeyondLastLine: false,
						automaticLayout: true,
						minimap: {
							enabled: false,
						},
						lineNumbers,
						lineNumbersMinChars,
					}}
					language={language || "javascript"}
					onChange={setValue}
				/>
			</div>
		</div>
	)
}

export default CodeField

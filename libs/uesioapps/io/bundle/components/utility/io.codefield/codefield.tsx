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
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")

const CodeField: FunctionComponent<CodeFieldProps> = (props) => {
	const { setValue, value, mode, language, context, hideLabel, label } = props
	const readonly = mode === "READ"
	const width = props.definition?.width as string
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(width && { width }),
			},
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
					}}
					language={language || "javascript"}
					onChange={setValue}
				/>
			</div>
		</div>
	)
}

export default CodeField

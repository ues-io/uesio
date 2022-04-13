import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection } from "@uesio/ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkDownFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	placeholder?: string
	password?: boolean
}

const MarkDownField: FunctionComponent<MarkDownFieldProps> = (props) => {
	const { setValue, value, mode, placeholder } = props
	const readonly = mode === "READ"
	const classes = styles.useUtilityStyles(
		{
			input: {
				resize: "none",
			},
			readonly: {},
		},
		props
	)

	const commonProps = {
		value: value || "",
		placeholder,
		className: styles.cx(classes.input, readonly && classes.readonly),
		disabled: readonly,
		onChange: (
			event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => setValue(event.target.value),
	}

	return readonly ? (
		<ReactMarkdown
			children={value ? value : ""}
			remarkPlugins={[remarkGfm]}
		/>
	) : (
		<textarea {...commonProps} rows={40} cols={40} />
	)
}

export default MarkDownField

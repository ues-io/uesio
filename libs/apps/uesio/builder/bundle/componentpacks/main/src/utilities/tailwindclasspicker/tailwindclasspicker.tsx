import { component, definition, wire } from "@uesio/ui"
import { useMemo, useState } from "react"
import fuzzysort from "fuzzysort"
import SearchArea from "../../helpers/searcharea"

type Props = {
	setValue?: (value: wire.PlainFieldValue) => void
	value?: wire.FieldValue
	parsedTokens: string[][]
}

type SortResult = {
	className: string
	css: string
}

const TailwindClassPicker: definition.UtilityComponent<Props> = (props) => {
	const { context, setValue, parsedTokens } = props
	const Button = component.getUtility("uesio/io.button")

	const tailwindClasses = useMemo(
		() =>
			parsedTokens.map(([className, cssClasses]) => ({
				className,
				classNamePrepared: fuzzysort.prepare(className),
				css: cssClasses,
				cssPrepared: fuzzysort.prepare(cssClasses),
			})),
		[parsedTokens]
	)

	const [searchTerm, setSearchTerm] = useState("")

	const results = fuzzysort.go<SortResult>(searchTerm, tailwindClasses, {
		keys: ["classNamePrepared", "cssPrepared"],
		// allowTypo: false,
		// threshold: -10000,
	})

	return (
		<>
			<SearchArea
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				context={context}
			/>
			{results.map((element) => (
				<Button
					variant="uesio/builder.panelactionbutton"
					key={element.obj.className}
					label={element.obj.className}
					context={context}
					onClick={() => setValue?.(element.obj.className)}
				/>
			))}
		</>
	)
}

export default TailwindClassPicker

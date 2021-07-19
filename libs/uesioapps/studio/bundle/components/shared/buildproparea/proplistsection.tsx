import { FunctionComponent } from "react"
import PropList from "./proplist"
import ExpandPanel from "../expandpanel"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { builder } from "@uesio/ui"

const PropListSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, definition, context, propsDef, getValue, setValue } = props
	const section = props.section as builder.PropListSection

	return (
		<ExpandPanel
			defaultExpanded={false}
			title={section.title}
			context={context}
		>
			{section.properties && (
				<PropList
					path={path}
					definition={definition}
					propsDef={propsDef}
					properties={section.properties}
					context={context}
					getValue={getValue}
					setValue={setValue}
				/>
			)}
		</ExpandPanel>
	)
}

export default PropListSection

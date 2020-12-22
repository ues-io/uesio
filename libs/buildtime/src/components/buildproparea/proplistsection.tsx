import { FunctionComponent } from "react"
import PropList from "./proplist"
import ExpandPanel from "../toolbar/expandpanel/expandpanel"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { builder } from "@uesio/ui"

const PropListSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, definition, context } = props
	const section = props.section as builder.PropListSection

	return (
		<ExpandPanel defaultExpanded={false} title={section.title}>
			{section.properties && (
				<PropList
					path={path}
					definition={definition}
					properties={section.properties}
					context={context}
				/>
			)}
		</ExpandPanel>
	)
}

export default PropListSection

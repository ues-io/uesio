import { FC } from "react"

import { Props } from "./filternumberdefinition"
import { component } from "@uesio/ui"
const NumberField = component.getUtility("uesio/io.numberfield")

const Filter: FC<Props> = (props) => {
	const { context, definition } = props

	return (
		<div>
			<NumberField
				value={"50"}
				setValue={(value: number | null): void =>
					console.log("setting", value)
				}
				context={context}
				variant="uesio/io.textfield:uesio/studio.propfield"
			/>

			{definition.point === "range" && (
				<NumberField
					value={"200"}
					setValue={(value: number | null): void =>
						console.log("setting outer buond", value)
					}
					context={context}
					variant="uesio/io.textfield:uesio/studio.propfield"
				/>
			)}
		</div>
	)
}

export default Filter

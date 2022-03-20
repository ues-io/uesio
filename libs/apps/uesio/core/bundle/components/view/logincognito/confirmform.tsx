import { definition, component } from "@uesio/ui"
import { FunctionComponent, useState, Dispatch, SetStateAction } from "react"

interface ConfirmFormProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	confirm: (verificationCode: string) => void
}

const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")
const TextField = component.registry.getUtility("uesio/io.textfield")
const Button = component.registry.getUtility("uesio/io.button")
const Grid = component.registry.getUtility("uesio/io.grid")
const Text = component.registry.getUtility("uesio/io.text")
const Link = component.registry.getUtility("uesio/io.link")

const ConfirmForm: FunctionComponent<ConfirmFormProps> = (props) => {
	const { setMode, confirm, context } = props
	const [verificationCode, setVerificationCode] = useState("")

	return (
		<>
			<FieldWrapper context={context} label="Verification Code">
				<TextField
					context={context}
					value={verificationCode}
					setValue={setVerificationCode}
				/>
			</FieldWrapper>
			<Grid
				context={context}
				styles={{
					root: {
						gridTemplateColumns: "1fr 1fr",
						columnGap: "10px",
						padding: "20px 0",
					},
				}}
			>
				<Button
					context={context}
					variant="uesio/io.primary"
					label="Confirm"
					onClick={() => confirm(verificationCode)}
				/>
				<Button
					context={context}
					variant="uesio/io.secondary"
					label="Back to Signup"
					onClick={() => setMode("")}
				/>
			</Grid>
			<div>
				<Text context={context} text="Lost your code?&nbsp;" />
				<Link
					context={context}
					onClick={() => {
						// not implemented
					}}
					text="Resend Code"
				/>
			</div>
		</>
	)
}

export default ConfirmForm

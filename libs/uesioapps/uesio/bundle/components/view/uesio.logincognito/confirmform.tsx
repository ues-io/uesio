import { definition, component } from "@uesio/ui"
import { FunctionComponent, useState, Dispatch, SetStateAction } from "react"

interface ConfirmFormProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	confirm: (verificationCode: string) => void
}

const TextField = component.registry.getUtility("io.textfield")
const Button = component.registry.getUtility("io.button")
const Grid = component.registry.getUtility("io.grid")
const Text = component.registry.getUtility("io.text")
const Link = component.registry.getUtility("io.link")

const ConfirmForm: FunctionComponent<ConfirmFormProps> = (props) => {
	const { setMode, confirm } = props
	const [verificationCode, setVerificationCode] = useState("")

	return (
		<>
			<TextField
				{...props}
				label="Verification Code"
				setValue={setVerificationCode}
			/>
			<Grid
				{...props}
				styles={{
					root: {
						gridTemplateColumns: "1fr 1fr",
						columnGap: "10px",
						padding: "20px 0",
					},
				}}
			>
				<Button
					{...props}
					variant="io.primary"
					label="Confirm"
					onClick={() => confirm(verificationCode)}
				/>
				<Button
					{...props}
					variant="io.secondary"
					label="Back to Signup"
					onClick={() => setMode("")}
				/>
			</Grid>
			<div>
				<Text {...props} text="Lost your code?&nbsp;" />
				<Link
					{...props}
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

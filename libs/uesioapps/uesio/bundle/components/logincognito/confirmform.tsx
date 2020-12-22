import { FunctionComponent, useState, ChangeEvent } from "react"
import { material } from "@uesio/ui"
import { useLoginStyles } from "./logincognito"

type ConfirmFormProps = {
	setMode: React.Dispatch<React.SetStateAction<string>>
	confirm: (verificationCode: string) => Promise<void>
}

const ConfirmForm: FunctionComponent<ConfirmFormProps> = (props) => {
	const classes = useLoginStyles(props)

	const [verificationCode, setVerificationCode] = useState("")

	return (
		<>
			<material.TextField
				label="Verification Code"
				variant="outlined"
				type="password"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setVerificationCode(e.target.value)
				}
			/>
			<material.Button
				onClick={() => props.setMode("")}
				className={classes.button}
			>
				Back to Signup
			</material.Button>
			<material.Button
				variant="contained"
				color="primary"
				className={classes.button}
				onClick={() => {
					props.confirm(verificationCode)
				}}
			>
				Confirm
			</material.Button>
			<div>
				<material.Typography variant="body2" component="span">
					Lost your code?&nbsp;
				</material.Typography>
				<material.Link
					component="span"
					variant="body2"
					onClick={() => console.info("I'm a button.")}
				>
					Resend code
				</material.Link>
			</div>
		</>
	)
}

export default ConfirmForm

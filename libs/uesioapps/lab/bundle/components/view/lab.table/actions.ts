import { Action } from "../../utility/lab.actionsbar/actionsbardefinition"
export default (
	wireId: string
): { tableActions: Action[]; rowActions: Action[] } => ({
	tableActions: [
		{
			name: "save",
			signals: [
				{ signal: "wire/SAVE", wires: [wireId] },
				{
					signal: "notification/ADD",
					text: "saved",
				},
				{ signal: "wire/EMPTY", wireId },
				{ signal: "wire/CREATE_RECORD", wireId },
			],
		},
		{
			name: "cancel",
			signals: [{ signal: "wire/CANCEL", wireId }],
		},
		{
			name: "delete",
			signals: [
				{ signal: "wire/MARK_FOR_DELETE", wireId },
				{ signal: "wire/SAVE", wireId },
			],
		},
	],
	rowActions: [
		{
			name: "save",
			signals: [
				{ signal: "wire/SAVE", wires: [wireId] },
				{
					signal: "notification/ADD",
					text: "saved",
				},
				{ signal: "wire/EMPTY", wireId },
				{ signal: "wire/CREATE_RECORD", wireId },
			],
		},
		{
			name: "cancel",
			signals: [{ signal: "wire/CANCEL", wireId }],
		},
		{
			name: "delete",
			signals: [
				{ signal: "wire/MARK_FOR_DELETE", wireId },
				{ signal: "wire/SAVE", wireId },
			],
		},
	],
})

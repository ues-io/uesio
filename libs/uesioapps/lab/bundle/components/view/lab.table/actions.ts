import { Action } from "../lab.actionsbar/actionsbardefinition"
export default (wireId: string): { tableActions: Action[] } => ({
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
	],
})

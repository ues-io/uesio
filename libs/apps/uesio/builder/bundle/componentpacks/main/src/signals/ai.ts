import { SignalBandDefinition, SignalDescriptor } from "../api/signalsapi"
import { wire } from "@uesio/ui"

// The key for the entire band
const BAND = "ai"

const signals: SignalBandDefinition = {
	band: BAND,
	label: "AI",
	signals: {
		[`${BAND}/AUTOCOMPLETE`]: {
			label: "OpenAI: Autocomplete",
			description:
				"Use OpenAI to suggest completions for a prompt, or to engage in a conversation.",
			properties: () => [
				{
					type: "SELECT",
					name: "format",
					label: "Format",
					blankOptionLabel: "Select a format...",
					options: [
						{ label: "Text", value: "text" },
						{ label: "Chat", value: "chat" },
					],
				},
				{
					type: "SELECT",
					name: "model",
					label: "Model",
					blankOptionLabel: "Select model...",
					options: (record: wire.PlainWireRecord) => {
						const format = record?.format || "chat"
						return format === "chat"
							? [
									{
										label: "GPT4 Family",
										disabled: true,
										value: "-gpt4-",
									},
									{
										label: "GPT432K0314",
										value: "gpt-4-32k-0314",
									},
									{ label: "GPT432K", value: "gpt-4-32k" },
									{ label: "GPT40314", value: "gpt-4-0314" },
									{ label: "GPT4", value: "gpt-4" },
									{
										label: "GPT3 Family",
										disabled: true,
										value: "-gpt3-",
									},
									{
										label: "GPT3Dot5Turbo0301",
										value: "gpt-3.5-turbo-0301",
									},
									{
										label: "GPT3Dot5Turbo",
										value: "gpt-3.5-turbo",
									},
							  ]
							: [
									// Text optimized models
									{
										label: "Text Models",
										disabled: true,
										value: "-text-",
									},
									{
										label: "GPT3TextDavinci003",
										value: "text-davinci-003",
									},
									{
										label: "GPT3TextDavinci002",
										value: "text-davinci-002",
									},
									{
										label: "GPT3TextCurie001",
										value: "text-curie-001",
									},
									{
										label: "GPT3TextBabbage001",
										value: "text-babbage-001",
									},
									{
										label: "GPT3TextAda001",
										value: "text-ada-001",
									},
									{
										label: "GPT3TextDavinci001",
										value: "text-davinci-001",
									},
									{
										label: "GPT3DavinciInstructBeta",
										value: "davinci-instruct-beta",
									},
									{ label: "GPT3Davinci", value: "davinci" },
									{
										label: "GPT3CurieInstructBeta",
										value: "curie-instruct-beta",
									},
									{ label: "GPT3Curie", value: "curie" },
									{ label: "GPT3Ada", value: "ada" },
									{ label: "GPT3Babbage", value: "babbage" },
									// Code models - optimized for code-specific tasks, and use a different tokenizer which optimizes for whitespace.
									{
										label: "Code-optimized Models",
										disabled: true,
										value: "-code-",
									},
									{
										label: "CodexCodeDavinci002",
										value: "code-davinci-002",
									},
									{
										label: "CodexCodeCushman001",
										value: "code-cushman-001",
									},
									{
										label: "CodexCodeDavinci001",
										value: "code-davinci-001",
									},
							  ]
					},
				},
				{
					type: "TEXT",
					name: "input",
					label: "Input",
				},
				{
					type: "NUMBER",
					name: "maxResults",
					label: "Max Results",
				},
				{
					type: "CHECKBOX",
					name: "useCache",
					label: "Cache responses",
				},
			],
			canError: true,
			outputs: [{ name: "choices", type: "LIST" }],
		},
	} as Record<string, SignalDescriptor>,
}
export default signals

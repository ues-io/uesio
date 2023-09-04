import { preparse } from "./suggestdatabutton"

// Preparse exists because "best-effort-json-parser" can't handle the insanity
// that is OpenAI's responses to prompts that are supposed to contain JSON.
describe("preparse", () => {
	const testCases = [
		{
			name: "should intercept OpenAI JSON blocks",
			input: 'Here is some JSON for you! \n\n```json\n[{"foo":"bar"}]``` Aren\'t you glad I formatted it as JSON!?!\n',
			expect: '[{"foo":"bar"}]',
		},
		{
			name: "should try to find the first opening brace",
			input: 'Here is some JSON for you! \n\n[{"foo":"bar"}] SUCH JSON\n',
			expect: '[{"foo":"bar"}]',
		},
		{
			name: "should just return anything else",
			input: 'Here is some JSON for you! {"foo":"bar"} SUCH JSON\n',
			expect: 'Here is some JSON for you! {"foo":"bar"} SUCH JSON\n',
		},
	]
	testCases.forEach((testCase) => {
		it(testCase.name, () =>
			expect(preparse(testCase.input)).toEqual(testCase.expect)
		)
	})
})

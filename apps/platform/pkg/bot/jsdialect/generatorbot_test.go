package jsdialect

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

var simple = meta.TrimYamlString(`
mykey: myvalue
`)

var double = meta.TrimYamlString(`
mykey: myvalue:myvalue2
`)

var simpleMerge = meta.TrimYamlString(`
mykey: ${mymerge}
`)

var doubleMerge = meta.TrimYamlString(`
mykey: ${mymerge}:${mymerge2}
`)

var keyMerge = meta.TrimYamlString(`
${keymerge}: myvalue
`)

var inlineMerge = meta.TrimYamlString(`
mykey: prefix:${mymerge}:suffix
`)

var inlineMergeResult = meta.TrimYamlString(`
mykey: prefix:myvalue:suffix
`)

var listMergeResult = meta.TrimYamlString(`
mykey:
  - one
  - two
`)

var numberMergeResult = meta.TrimYamlString(`
mykey: 42
`)

var booleanMergeResult = meta.TrimYamlString(`
mykey: true
`)

var arrayOfStringsMergeResult = meta.TrimYamlString(`
mykey:
  - bleh
  - blah
`)

var noValueMergeResult = meta.TrimYamlString(`
mykey: null
`)

var list = meta.TrimYamlString(`
- one
- two
`)

var mergeInComponent = meta.TrimYamlString(`
components:
  - me/my.component:
      mykey: ${mymerge}
`)

var mergeInComponentResult = meta.TrimYamlString(`
components:
  - me/my.component:
      mykey: myvalue
`)

func Test_MergeYAMLString(t *testing.T) {

	botAPI := &GeneratorBotAPI{}

	tests := []struct {
		name        string
		params      map[string]interface{}
		template    string
		response    string
		expectedErr error
	}{
		{
			name:     "Sanity",
			params:   map[string]interface{}{},
			template: simple,
			response: simple,
		},
		{
			name: "Merge Value",
			params: map[string]interface{}{
				"mymerge": "myvalue",
			},
			template: simpleMerge,
			response: simple,
		},
		{
			name: "DoubleMerge Value",
			params: map[string]interface{}{
				"mymerge":  "myvalue",
				"mymerge2": "myvalue2",
			},
			template: doubleMerge,
			response: double,
		},
		{
			name:     "Merge Value Missing",
			params:   map[string]interface{}{},
			template: simpleMerge,
			response: simpleMerge,
		},
		{
			name: "Inline Merge Value",
			params: map[string]interface{}{
				"mymerge": "myvalue",
			},
			template: inlineMerge,
			response: inlineMergeResult,
		},
		{
			name: "Inline Merge Value Fail",
			params: map[string]interface{}{
				"mymerge": list,
			},
			template:    inlineMerge,
			response:    "",
			expectedErr: errors.New("cannot merge a sequence or map into a multipart template: ${mymerge} : prefix:${mymerge}:suffix"),
		},
		{
			name: "List Merge",
			params: map[string]interface{}{
				"mymerge": list,
			},
			template: simpleMerge,
			response: listMergeResult,
		},
		{
			name: "Key Merge",
			params: map[string]interface{}{
				"keymerge": "mykey",
			},
			template: keyMerge,
			response: simple,
		},
		{
			name: "Merge In Component Value",
			params: map[string]interface{}{
				"mymerge": "myvalue",
			},
			template: mergeInComponent,
			response: mergeInComponentResult,
		},
		{
			name: "Number Merge",
			params: map[string]interface{}{
				"mymerge": int64(42),
			},
			template: simpleMerge,
			response: numberMergeResult,
		},
		{
			name: "Boolean Merge",
			params: map[string]interface{}{
				"mymerge": true,
			},
			template: simpleMerge,
			response: booleanMergeResult,
		},
		{
			name: "Array of Strings Merge",
			params: map[string]interface{}{
				"mymerge": []string{"bleh", "blah"},
			},
			template: simpleMerge,
			response: arrayOfStringsMergeResult,
		},
		{
			name: "No Value Strings Merge",
			params: map[string]interface{}{
				"mymerge": nil,
			},
			template: simpleMerge,
			response: noValueMergeResult,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			response, err := botAPI.MergeYamlString(tt.params, tt.template)
			if tt.expectedErr != nil {
				assert.Equal(t, tt.expectedErr, err)
				return
			}
			if err != nil {
				t.Errorf("Unexpected failure merging: %s", err.Error())
			}

			assert.Equal(t, tt.response, response)

		})
	}
}

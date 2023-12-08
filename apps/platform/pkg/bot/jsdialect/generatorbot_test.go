package jsdialect

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

var simple = meta.TrimYamlString(`
mykey: myvalue
`)

var simpleMerge = meta.TrimYamlString(`
mykey: ${mymerge}
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

var list = meta.TrimYamlString(`
- one
- two
`)

func Test_MergeYAMLString(t *testing.T) {

	botAPI := &GeneratorBotAPI{}

	tests := []struct {
		name     string
		params   map[string]interface{}
		template string
		response string
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
			name: "Inline Merge Value",
			params: map[string]interface{}{
				"mymerge": "myvalue",
			},
			template: inlineMerge,
			response: inlineMergeResult,
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
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			response, err := botAPI.MergeYamlString(tt.params, tt.template)
			if err != nil {
				assert.Fail(t, tt.name+" : "+err.Error())
			}

			assert.Equal(t, tt.response, response)

		})
	}
}

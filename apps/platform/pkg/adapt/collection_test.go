package adapt

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

const arrayOfObjects = `[
	{
		"uesio/studio.name": "core",
		"uesio/studio.fullname": "uesio/core",
		"uesio/studio.description": "Base uesio functionality",
		"uesio/studio.color": "#a05195",
		"uesio/studio.icon": "hub",
		"uesio/studio.public": true,
		"uesio/studio.user": {
			"uesio/core.uniquekey": "uesio"
		}
	},
	{
		"uesio/studio.name": "io",
		"uesio/studio.fullname": "uesio/io",
		"uesio/studio.description": "A component library for uesio",
		"uesio/studio.color": "#2f4b7c",
		"uesio/studio.icon": "widgets",
		"uesio/studio.public": true,
		"uesio/studio.user": {
			"uesio/core.uniquekey": "uesio"
		}
	}
]`

var expectContents = []string{
	"\"uesio/studio.color\":\"#a05195\"",
	"\"uesio/studio.description\":\"Base uesio functionality\"",
	"\"uesio/studio.icon\":\"hub\"",
	"\"uesio/studio.user\":{\"uesio/core.uniquekey\":\"uesio\"}",
	"\"uesio/studio.description\":\"A component library for uesio\"",
	"\"uesio/studio.color\":\"#2f4b7c\"",
}

func TestCollection_UnmarshalJSON(t *testing.T) {
	tests := []struct {
		name         string
		input        string
		wantErr      bool
		wantLength   int
		wantContains []string
	}{
		{
			"array of objects",
			arrayOfObjects,
			false,
			2,
			expectContents,
		},
	}
	for _, tt := range tests {
		t.Run("it should unmarshal "+tt.name, func(t *testing.T) {
			coll := Collection{}
			if err := json.Unmarshal([]byte(tt.input), &coll); (err != nil) != tt.wantErr {
				t.Errorf("UnmarshalJSON() error = %v, wantErr %v", err, tt.wantErr)
			}
			// Verify length
			assert.Equal(t, len(coll), tt.wantLength)
			marshalledBytes, err := json.Marshal(coll)
			if err != nil {
				t.Errorf("Error unmarshalling json: %s", err.Error())
			} else {
				marshalled := string(marshalledBytes)
				// Do some sanity tests on the marshalled output
				for _, s := range tt.wantContains {
					assert.True(t, strings.Contains(marshalled, s), "marshalled JSON should contain "+s)
				}
			}
		})
	}
}

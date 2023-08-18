package validation

import (
	"github.com/stretchr/testify/assert"
	"github.com/xeipuuv/gojsonschema"
	"testing"
)

func TestGetSchema(t *testing.T) {
	tests := []struct {
		name    string
		uri     string
		asserts func(t *testing.T, schema *gojsonschema.Schema)
		wantErr string
	}{
		{
			"it should load a schema using $StaticFile{} uri",
			"$StaticFile{/ui/types/metadata/view/view.schema.json}",
			func(t *testing.T, schema *gojsonschema.Schema) {
				assert.NotNil(t, schema)
			},
			"",
		},
		{
			"it should return an error for schema uris in an unexpected format",
			"bad",
			nil,
			"unable to load schema with uri: bad",
		},
		{
			"it should return an error if $StaticFile{} schema uri is malformed",
			"$StaticFile{bad",
			nil,
			"unable to load schema with uri: $StaticFile{bad",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := GetSchema(tt.uri)
			if err != nil && err.Error() != tt.wantErr {
				t.Errorf("GetSchema() error = %v, wantErr: %v", err, tt.wantErr)
				return
			}
			if tt.asserts != nil {
				tt.asserts(t, got)
			}
		})
	}
}

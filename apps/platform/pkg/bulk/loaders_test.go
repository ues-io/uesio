package bulk

import (
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"testing"
)

func Test_TimestampLoader(t *testing.T) {

	fieldMetadata := &adapt.FieldMetadata{
		Type:      "TIMESTAMP",
		Name:      "updatedat",
		Namespace: "uesio/core",
	}

	mapping := &meta.FieldMapping{
		Type:       "IMPORT",
		ColumnName: "some_column_name",
	}

	getValue := func(data interface{}, mapping *meta.FieldMapping, index int) string {
		record := data.([]string)
		return record[index]
	}

	tests := []struct {
		name    string
		input   string
		want    interface{}
		wantErr string
	}{
		{
			"parse timestamp from RFC3339",
			"2022-11-18T03:19:02Z",
			int64(1668741542),
			"",
		},
		{
			"parse timestamp from Unix timestamp",
			"1668741542",
			int64(1668741542),
			"",
		},
		{
			"return error if input is not an expected format",
			"2022/12/13",
			nil,
			"Invalid format for TIMESTAMP field 'uesio/core.updatedat': value '2022/12/13' is not valid ISO-8601 UTC datetime or Unix timestamp",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			changeItem := &adapt.Item{}
			data := []string{
				tt.input,
			}
			loaderFunc := getTimestampLoader(0, mapping, fieldMetadata, getValue)
			err := loaderFunc(*changeItem, data)
			if tt.wantErr != "" {
				assert.Errorf(t, err, tt.wantErr)
			} else {
				assert.Nil(t, err)
				val, err := changeItem.GetField(fieldMetadata.GetFullName())
				assert.Nil(t, err)
				assert.Equalf(t, tt.want, val, "TimestampLoader(%s)", tt.input)
			}
		})
	}
}

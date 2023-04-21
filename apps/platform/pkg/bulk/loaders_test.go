package bulk

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
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
				assert.Equal(t, err.Error(), tt.wantErr)
			} else {
				assert.Nil(t, err)
				val, err := changeItem.GetField(fieldMetadata.GetFullName())
				assert.Nil(t, err)
				assert.Equalf(t, tt.want, val, "TimestampLoader(%s)", tt.input)
			}
		})
	}
}

func Test_NumberLoader(t *testing.T) {

	fieldMetadata := &adapt.FieldMetadata{
		Type:      "NUMBER",
		Name:      "total_population",
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
			"parse number from float",
			"2022.64",
			float64(2022.64),
			"",
		},
		{
			"parse number from int",
			"1668741542",
			float64(1668741542),
			"",
		},
		{
			"parse number from float with .",
			"2022.",
			float64(2022.0),
			"",
		},
		{
			"return error if input is not an expected format",
			"2022/12/13",
			nil,
			"Invalid format for NUMBER field 'uesio/core.total_population': value '2022/12/13' is not a valid number",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			changeItem := &adapt.Item{}
			data := []string{
				tt.input,
			}
			loaderFunc := getNumberLoader(0, mapping, fieldMetadata, getValue)
			err := loaderFunc(*changeItem, data)
			if tt.wantErr != "" {
				assert.Errorf(t, err, tt.wantErr)
				assert.Equal(t, err.Error(), tt.wantErr)
			} else {
				assert.Nil(t, err)
				val, err := changeItem.GetField(fieldMetadata.GetFullName())
				assert.Nil(t, err)
				assert.Equalf(t, tt.want, val, "NumberLoader(%s)", tt.input)
			}
		})
	}
}

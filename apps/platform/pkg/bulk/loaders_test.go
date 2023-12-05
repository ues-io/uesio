package bulk

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func Test_TimestampLoader(t *testing.T) {

	fieldMetadata := &wire.FieldMetadata{
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
			"ignore blank values",
			"",
			nil,
			"",
		},
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
			changeItem := &wire.Item{}
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
				if tt.want == nil {
					assert.NotNil(t, err)
					assert.Equal(t, err.Error(), "Field not found: "+fieldMetadata.GetFullName())
				} else {
					assert.Nil(t, err)
					assert.Equalf(t, tt.want, val, "TimestampLoader(%s)", tt.input)
				}
			}
		})
	}
}

func Test_NumberLoader(t *testing.T) {

	fieldMetadata := &wire.FieldMetadata{
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
			"blank value should be nil",
			"",
			nil,
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
			changeItem := &wire.Item{}
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

func Test_BooleanLoader(t *testing.T) {

	fieldMetadata := &wire.FieldMetadata{
		Type:      "CHECKBOX",
		Name:      "checkbox",
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
			"parse boolean value true",
			"true",
			true,
			"",
		},
		{
			"parse boolean value false",
			"false",
			false,
			"",
		},
		{
			"blank value should be nil",
			"",
			nil,
			"",
		},
		{
			"return error if input can not be parsed as boolean",
			"not a boolean",
			nil,
			"Invalid format for CHECKBOX field 'uesio/core.checkbox': value 'not a boolean' is not a valid boolean",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			changeItem := &wire.Item{}
			data := []string{
				tt.input,
			}
			loaderFunc := getBooleanLoader(0, mapping, fieldMetadata, getValue)
			err := loaderFunc(*changeItem, data)
			if tt.wantErr != "" {
				assert.Errorf(t, err, tt.wantErr)
				assert.Equal(t, err.Error(), tt.wantErr)
			} else {
				assert.Nil(t, err)
				val, err := changeItem.GetField(fieldMetadata.GetFullName())
				assert.Nil(t, err)
				assert.Equalf(t, tt.want, val, "BooleanLoader(%s)", tt.input)
			}
		})
	}
}

func Test_MultiselectLoader(t *testing.T) {

	fieldMetadata := &wire.FieldMetadata{
		Type: "MULTISELECT",
		Name: "status",
		SelectListMetadata: &wire.SelectListMetadata{
			Name: "status",
			Options: []meta.SelectListOption{
				{
					Label: "Registered",
					Value: "REGISTERED",
				},
				{
					Label: "Completed",
					Value: "COMPLETED",
				},
			},
		},
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
			"parse multiselect from empty string",
			"",
			nil,
			"",
		},
		{
			"parse multiselect from valid JSON array",
			"[\"COMPLETED\",\"REGISTERED\"]",
			map[string]bool{
				"COMPLETED":  true,
				"REGISTERED": true,
			},
			"",
		},
		{
			"return error if input is not an expected format",
			"asjdfkasdjf",
			nil,
			"invalid Multiselect field value",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			changeItem := &wire.Item{}
			data := []string{
				tt.input,
			}
			loaderFunc := getMultiSelectLoader(0, mapping, fieldMetadata, getValue)
			err := loaderFunc(*changeItem, data)
			if tt.wantErr != "" {
				assert.Errorf(t, err, tt.wantErr)
				assert.Equal(t, err.Error(), tt.wantErr)
			} else {
				assert.Nil(t, err)
				val, err := changeItem.GetField(fieldMetadata.GetFullName())
				assert.Nil(t, err)
				assert.Equalf(t, tt.want, val, "MultiselectLoader(%s)", tt.input)
			}
		})
	}
}

func Test_MapLoader(t *testing.T) {

	fieldMetadata := &wire.FieldMetadata{
		Type:      "MAP",
		Name:      "status",
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
		want    map[string]interface{}
		wantErr string
	}{
		{
			"parse MAP from empty string",
			"",
			map[string]interface{}{},
			"",
		},
		{
			"parse MAP from empty JSON object",
			"{}",
			map[string]interface{}{},
			"",
		},
		{
			"parse MAP from valid JSON object",
			"{\"chattanooga\":{\"is_accurate\":false,\"latitude\":34.555,\"longitude\":-12.12},\"nashville\":{\"is_accurate\":false,\"latitude\":35.555,\"longitude\":-14.12}}",
			map[string]interface{}{
				"chattanooga": map[string]interface{}{
					"is_accurate": false,
					"latitude":    34.555,
					"longitude":   -12.12,
				},
				"nashville": map[string]interface{}{
					"is_accurate": false,
					"latitude":    35.555,
					"longitude":   -14.12,
				},
			},
			"",
		},
		{
			"return error if input is not an expected format",
			"asjdfkasdjf",
			nil,
			"invalid MAP field value",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			changeItem := &wire.Item{}
			data := []string{
				tt.input,
			}
			loaderFunc := getMapLoader(0, mapping, fieldMetadata, getValue)
			err := loaderFunc(*changeItem, data)
			if tt.wantErr != "" {
				assert.Errorf(t, err, tt.wantErr)
				assert.Equal(t, err.Error(), tt.wantErr)
			} else {
				assert.Nil(t, err)
				val, err := changeItem.GetField(fieldMetadata.GetFullName())
				assert.Nil(t, err)
				mapVal, ok := val.(map[string]interface{})
				assert.True(t, ok, "expected val to be a map, but it was not: "+tt.input)
				for k, wantV := range tt.want {
					assert.Equalf(t, wantV, mapVal[k], "MapLoader(%s)", tt.input)
					if wantMapValue, ok := wantV.(map[string]interface{}); ok {
						actualMapVal := mapVal[k].(map[string]interface{})
						for k1, v2 := range wantMapValue {
							assert.Equalf(t, v2, actualMapVal[k1], "MapLoader(%s)", tt.input)
						}
					}
				}
			}
		})
	}
}

func Test_ListLoader(t *testing.T) {

	fieldMetadata := &wire.FieldMetadata{
		Type:      "LIST",
		Name:      "status",
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
		want    []interface{}
		wantErr string
	}{
		{
			"parse LIST from empty string",
			"",
			[]interface{}{},
			"",
		},
		{
			"parse LIST from empty JSON array",
			"[]",
			[]interface{}{},
			"",
		},
		{
			"parse LIST from valid JSON array of strings",
			"[\"bar\",\"foo\"]",
			[]interface{}{"bar", "foo"},
			"",
		},
		{
			"parse LIST from valid JSON array of numbers",
			"[1,2]",
			[]interface{}{1.0, 2.0},
			"",
		},
		{
			"return error if input is not an expected format",
			"asjdfkasdjf",
			nil,
			"invalid LIST field value",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			changeItem := &wire.Item{}
			data := []string{
				tt.input,
			}
			loaderFunc := getListLoader(0, mapping, fieldMetadata, getValue)
			err := loaderFunc(*changeItem, data)
			if tt.wantErr != "" {
				assert.Errorf(t, err, tt.wantErr)
				assert.Equal(t, err.Error(), tt.wantErr)
			} else {
				assert.Nil(t, err)
				val, err := changeItem.GetField(fieldMetadata.GetFullName())
				assert.Nil(t, err)
				listVal, ok := val.([]interface{})
				assert.True(t, ok, "expected val to be a list, but it was not: "+tt.input)
				assert.Equal(t, len(listVal), len(tt.want))
				for idx, el := range tt.want {
					assert.Equalf(t, listVal[idx], el, "ListLoader(%s)", tt.input)
				}
			}
		})
	}
}

func Test_StructLoader(t *testing.T) {

	fieldMetadata := &wire.FieldMetadata{
		Type:      "STRUCT",
		Name:      "location",
		Namespace: "uesio/core",
		SubFields: map[string]*wire.FieldMetadata{
			"latitude": {
				Name: "latitude",
				Type: "NUMBER",
			},
			"longitude": {
				Name: "longitude",
				Type: "NUMBER",
			},
		},
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
		want    map[string]interface{}
		wantErr string
	}{
		{
			"parse STRUCT from empty string",
			"",
			map[string]interface{}{},
			"",
		},
		{
			"parse STRUCT from empty JSON object",
			"{}",
			map[string]interface{}{},
			"",
		},
		{
			"parse STRUCT from valid JSON object",
			"{\"latitude\":35.555,\"longitude\":-14.12}",
			map[string]interface{}{
				"latitude":  35.555,
				"longitude": -14.12,
			},
			"",
		},
		{
			"ignore fields in JSON object not present in STRUCT",
			"{\"latitude\":35.555,\"longitude\":-14.12,\"foo\":\"bar\"}",
			map[string]interface{}{
				"latitude":  35.555,
				"longitude": -14.12,
			},
			"",
		},
		{
			"return error if input is not an expected format",
			"asjdfkasdjf",
			nil,
			"Invalid struct format: uesio/core.location : invalid character 'a' looking for beginning of value",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			changeItem := &wire.Item{}
			data := []string{
				tt.input,
			}
			loaderFunc := getStructLoader(0, mapping, fieldMetadata, getValue)
			err := loaderFunc(*changeItem, data)
			if tt.wantErr != "" {
				assert.Errorf(t, err, tt.wantErr)
				assert.Equal(t, err.Error(), tt.wantErr)
			} else {
				assert.Nil(t, err)
				val, err := changeItem.GetField(fieldMetadata.GetFullName())
				assert.Nil(t, err)
				mapVal, ok := val.(map[string]interface{})
				assert.True(t, ok, "expected val to be a map, but it was not: "+tt.input)
				assert.Equal(t, len(mapVal), len(tt.want))
				for k, wantV := range tt.want {
					assert.Equalf(t, wantV, mapVal[k], "MapLoader(%s)", tt.input)
				}
			}
		})
	}
}

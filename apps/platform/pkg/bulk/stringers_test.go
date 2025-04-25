package bulk

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func Test_getStringValue(t *testing.T) {

	v7UUID, _ := uuid.NewV7()

	type args struct {
		fieldMetadata *wire.FieldMetadata
		value         any
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr string
	}{
		{
			"stringify number fields with floating point precision",
			args{
				&wire.FieldMetadata{
					Type: "NUMBER",
				},
				123.45,
			},
			"123.45",
			"",
		},
		{
			"stringify number fields with 0 value",
			args{
				&wire.FieldMetadata{
					Type: "NUMBER",
				},
				0,
			},
			"0",
			"",
		},
		{
			"stringify number fields with nil value",
			args{
				&wire.FieldMetadata{
					Type: "NUMBER",
				},
				nil,
			},
			"",
			"",
		},
		{
			"stringify number fields with integer precision",
			args{
				&wire.FieldMetadata{
					Type: "NUMBER",
				},
				123,
			},
			"123",
			"",
		},
		{
			"stringify CHECKBOX true",
			args{
				&wire.FieldMetadata{
					Type: "CHECKBOX",
				},
				true,
			},
			"true",
			"",
		},
		{
			"stringify CHECKBOX false",
			args{
				&wire.FieldMetadata{
					Type: "CHECKBOX",
				},
				false,
			},
			"false",
			"",
		},
		{
			"stringify CHECKBOX fields with nil value",
			args{
				&wire.FieldMetadata{
					Type: "CHECKBOX",
				},
				nil,
			},
			"",
			"",
		},
		{
			"Return error if invalid timestamp value",
			args{
				&wire.FieldMetadata{
					Type: "TIMESTAMP",
				},
				"foo",
			},
			"",
			"Bad timestamp value",
		},
		{
			"stringify TIMESTAMP fields with float64 values into RFC-3339 UTC format",
			args{
				&wire.FieldMetadata{
					Type: "TIMESTAMP",
				},
				float64(1674836033),
			},
			"2023-01-27T16:13:53Z",
			"",
		},
		{
			"stringify TIMESTAMP fields with int64 values into RFC-3339 UTC format",
			args{
				&wire.FieldMetadata{
					Type: "TIMESTAMP",
				},
				int64(1674836033),
			},
			"2023-01-27T16:13:53Z",
			"",
		},
		{
			"stringify DATE fields in ISO-8601 date format in UTC",
			args{
				&wire.FieldMetadata{
					Type: "DATE",
				},
				"2023-01-27",
			},
			"2023-01-27",
			"",
		},
		{
			"stringify DATE fields in ISO-8601 date format in UTC",
			args{
				&wire.FieldMetadata{
					Type: "DATE",
				},
				"2023-01-27",
			},
			"2023-01-27",
			"",
		},
		{
			"return Reference field as string",
			args{
				&wire.FieldMetadata{
					Type: "REFERENCE",
				},
				v7UUID.String(),
			},
			v7UUID.String(),
			"",
		},
		{
			"return ID field of Reference object",
			args{
				&wire.FieldMetadata{
					Type: "REFERENCE",
				},
				map[string]any{
					"uesio/core.id": v7UUID.String(),
				},
			},
			v7UUID.String(),
			"",
		},
		{
			"stringify MULTISELECT with multiple values",
			args{
				&wire.FieldMetadata{
					Type: "MULTISELECT",
				},
				map[string]any{
					"Ready, Set, Go":                   true,
					"\"Look at all \" these quotes \"": true,
				},
			},
			"[\"\\\"Look at all \\\" these quotes \\\"\",\"Ready, Set, Go\"]",
			"",
		},
		{
			"stringify MULTISELECT with no values",
			args{
				&wire.FieldMetadata{
					Type: "MULTISELECT",
				},
				map[string]any{},
			},
			"[]",
			"",
		},
		{
			"stringify MULTISELECT with nil value",
			args{
				&wire.FieldMetadata{
					Type: "MULTISELECT",
				},
				nil,
			},
			"",
			"",
		},
		{
			"stringify a LIST with TEXT values",
			args{
				&wire.FieldMetadata{
					Type: "LIST",
				},
				[]string{"foo", "bar"},
			},
			"[\"foo\",\"bar\"]",
			"",
		},
		{
			"stringify a LIST with NUMBER values",
			args{
				&wire.FieldMetadata{
					Type: "LIST",
				},
				[]float64{123.45, -555.33},
			},
			"[123.45,-555.33]",
			"",
		},
		{
			"stringify a LIST with nil value",
			args{
				&wire.FieldMetadata{
					Type: "LIST",
				},
				nil,
			},
			"",
			"",
		},
		{
			"stringify a LIST with nil value",
			args{
				&wire.FieldMetadata{
					Type: "LIST",
				},
				nil,
			},
			"",
			"",
		},
		{
			"stringify a STRUCT with nil value",
			args{
				&wire.FieldMetadata{
					Type: "STRUCT",
				},
				nil,
			},
			"",
			"",
		},
		{
			"stringify a STRUCT with value",
			args{
				&wire.FieldMetadata{
					Type: "STRUCT",
				},
				map[string]any{
					"is_accurate": true,
					"latitude":    34.555,
					"longitude":   -12.12,
				},
			},
			"{\"is_accurate\":true,\"latitude\":34.555,\"longitude\":-12.12}",
			"",
		},
		{
			"stringify a MAP with STRUCT subtype value",
			args{
				&wire.FieldMetadata{
					Type:    "MAP",
					SubType: "STRUCT",
				},
				map[string]any{
					"chattanooga": map[string]any{
						"is_accurate": false,
						"latitude":    34.555,
						"longitude":   -12.12,
					},
					"nashville": map[string]any{
						"is_accurate": false,
						"latitude":    35.555,
						"longitude":   -14.12,
					},
				},
			},
			"{\"chattanooga\":{\"is_accurate\":false,\"latitude\":34.555,\"longitude\":-12.12},\"nashville\":{\"is_accurate\":false,\"latitude\":35.555,\"longitude\":-14.12}}",
			"",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			got, err := getStringValue(tt.args.fieldMetadata, tt.args.value)
			if tt.wantErr != "" {
				assert.EqualError(t, err, tt.wantErr)
			} else {
				assert.Equal(t, tt.want, got)
			}
		})
	}
}

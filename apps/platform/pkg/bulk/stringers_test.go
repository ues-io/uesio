package bulk

import (
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"testing"
)

func Test_getStringValue(t *testing.T) {

	v7UUID, _ := uuid.NewV7()

	type args struct {
		fieldMetadata *adapt.FieldMetadata
		value         interface{}
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
				&adapt.FieldMetadata{
					Type: "NUMBER",
				},
				123.45,
			},
			"123.45",
			"",
		},
		{
			"stringify number fields with integer precision",
			args{
				&adapt.FieldMetadata{
					Type: "NUMBER",
				},
				123,
			},
			"123",
			"",
		},
		{
			"Return error if invalid timestamp value",
			args{
				&adapt.FieldMetadata{
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
				&adapt.FieldMetadata{
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
				&adapt.FieldMetadata{
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
				&adapt.FieldMetadata{
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
				&adapt.FieldMetadata{
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
				&adapt.FieldMetadata{
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
				&adapt.FieldMetadata{
					Type: "REFERENCE",
				},
				map[string]interface{}{
					"uesio/core.id": v7UUID.String(),
				},
			},
			v7UUID.String(),
			"",
		},
	}
	for _, tt := range tests {
		t.Run("it should "+tt.name, func(t *testing.T) {
			got, err := getStringValue(tt.args.fieldMetadata, tt.args.value)
			if tt.wantErr != "" {
				assert.EqualError(t, err, tt.wantErr)
			} else {
				assert.Equal(t, got, tt.want)
			}
		})
	}
}

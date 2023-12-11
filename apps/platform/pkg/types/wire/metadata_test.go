package wire

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCollectionMetadata_Merge(t *testing.T) {

	tests := []struct {
		name       string
		target     *CollectionMetadata
		other      *CollectionMetadata
		wantFields []string
	}{
		{
			"neither has fields",
			&CollectionMetadata{},
			&CollectionMetadata{},
			[]string{},
		},
		{
			"only target has fields",
			&CollectionMetadata{
				Fields: map[string]*FieldMetadata{
					"uesio/core.id": {},
				},
			},
			&CollectionMetadata{},
			[]string{
				"uesio/core.id",
			},
		},
		{
			"only other has fields",
			&CollectionMetadata{},
			&CollectionMetadata{
				Fields: map[string]*FieldMetadata{
					"uesio/core.id": {},
				},
			},
			[]string{
				"uesio/core.id",
			},
		},
		{
			"both have fields",
			&CollectionMetadata{
				Fields: map[string]*FieldMetadata{
					"uesio/core.uniquekey": {},
				},
			},
			&CollectionMetadata{
				Fields: map[string]*FieldMetadata{
					"uesio/core.id": {},
				},
			},
			[]string{
				"uesio/core.id",
				"uesio/core.uniquekey",
			},
		},
		{
			"target has all fields already",
			&CollectionMetadata{
				HasAllFields: true,
				Fields: map[string]*FieldMetadata{
					"uesio/core.uniquekey": {},
					"uesio/core.id":        {},
					"uesio/core.updatedat": {},
				},
			},
			&CollectionMetadata{
				Fields: map[string]*FieldMetadata{
					"uesio/core.id": {},
				},
			},
			[]string{
				"uesio/core.id",
				"uesio/core.uniquekey",
				"uesio/core.updatedat",
			},
		},
		{
			"other has all fields already",
			&CollectionMetadata{
				Fields: map[string]*FieldMetadata{
					"uesio/core.id": {},
				},
			},
			&CollectionMetadata{
				HasAllFields: true,
				Fields: map[string]*FieldMetadata{
					"uesio/core.uniquekey": {},
					"uesio/core.id":        {},
					"uesio/core.updatedat": {},
				},
			},
			[]string{
				"uesio/core.id",
				"uesio/core.uniquekey",
				"uesio/core.updatedat",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.target.Merge(tt.other)
			for _, field := range tt.wantFields {
				_, exists := tt.target.Fields[field]
				assert.True(t, exists, fmt.Sprintf("expected field %s to exist", field))
			}
		})
	}
}

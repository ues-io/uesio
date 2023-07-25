package meta

import (
	"github.com/francoispqt/gojay"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestFeatureFlag_MarshalJSONObject(t *testing.T) {
	tests := []struct {
		name     string
		ff       *FeatureFlag
		expected string
	}{
		{
			"CHECKBOX - no value or default, expect false",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				Type: "CHECKBOX",
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"\",\"type\":\"CHECKBOX\",\"value\":false}",
		},
		{
			"CHECKBOX - no value but default is true, expect true",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				User:         "bob",
				Type:         "CHECKBOX",
				DefaultValue: true,
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"bob\",\"type\":\"CHECKBOX\",\"value\":true}",
		},
		{
			"NUMBER - no value or default, expect 0 value",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				User: "joe",
				Type: "NUMBER",
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"joe\",\"type\":\"NUMBER\",\"value\":0}",
		},
		{
			"NUMBER - no value but there's a default, expect value to be the default",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				User:         "joe",
				Type:         "NUMBER",
				DefaultValue: 100,
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"joe\",\"type\":\"NUMBER\",\"value\":100}",
		},
		{
			"NUMBER - has value and a default, expect value to be used",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				User:         "joe",
				Type:         "NUMBER",
				DefaultValue: 100,
				Value:        47,
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"joe\",\"type\":\"NUMBER\",\"value\":47}",
		},
		{
			"NUMBER - has value that's not valid int, expect default value to be used",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				User:         "joe",
				Type:         "NUMBER",
				DefaultValue: 100,
				Value:        "foo",
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"joe\",\"type\":\"NUMBER\",\"value\":100}",
		},
		{
			"NUMBER - has min and max that are 0, should be ignored",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				User:         "joe",
				Type:         "NUMBER",
				DefaultValue: 100,
				Value:        47,
				Min:          0,
				Max:          0,
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"joe\",\"type\":\"NUMBER\",\"value\":47}",
		},
		{
			"NUMBER - has min and max that are non-0, should be serialized",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				User:         "joe",
				Type:         "NUMBER",
				DefaultValue: 5,
				Value:        2,
				Min:          0,
				Max:          10,
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"joe\",\"type\":\"NUMBER\",\"value\":2,\"min\":0,\"max\":10}",
		},
		{
			"should include validForOrgs true",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				User:         "bob",
				Type:         "CHECKBOX",
				ValidForOrgs: true,
				Value:        true,
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"bob\",\"type\":\"CHECKBOX\",\"validForOrgs\":true,\"value\":true}",
		},
		{
			"should not include validForOrgs if false or not provided",
			&FeatureFlag{
				BundleableBase: BundleableBase{
					Namespace: "uesio/studio",
					Name:      "stuff",
				},
				User:  "bob",
				Type:  "CHECKBOX",
				Value: true,
			},
			"{\"namespace\":\"uesio/studio\",\"name\":\"stuff\",\"user\":\"bob\",\"type\":\"CHECKBOX\",\"value\":true}",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := gojay.Marshal(tt.ff)
			assert.Nil(t, err)
			assert.Equal(t, string(result), tt.expected)
		})
	}
}

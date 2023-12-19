package meta

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGroupedPathFilter(t *testing.T) {
	type args struct {
		path           string
		conditionField string
		conditions     BundleConditions
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			"path not long enough - no match",
			args{
				path:           "luigi/foo/bar.yaml",
				conditionField: "uesio/studio.collection",
				conditions:     BundleConditions{},
			},
			false,
		},
		{
			"path does not correspond to a YAML file - no match",
			args{
				path:           "luigi/foo/bar/baz.txt",
				conditionField: "uesio/studio.collection",
				conditions:     BundleConditions{},
			},
			false,
		},
		{
			"no condition value in BundleConditions - should match",
			args{
				path:           "luigi/foo/bar/baz.yaml",
				conditionField: "uesio/studio.collection",
				conditions:     BundleConditions{},
			},
			true,
		},
		{
			"bad condition value in BundleConditions - don't count as match",
			args{
				path:           "luigi/foo/bar/baz.yaml",
				conditionField: "uesio/studio.collection",
				conditions: BundleConditions{
					"uesio/studio.collection": -1234,
				},
			},
			false,
		},
		{
			"single-value condition in BundleConditions - no match",
			args{
				path:           "luigi/foo/bar/baz.yaml",
				conditionField: "uesio/studio.collection",
				conditions: BundleConditions{
					"uesio/studio.collection": "uesio/crm.account",
				},
			},
			false,
		},
		{
			"single-value condition in BundleConditions - matches",
			args{
				path:           "luigi/foo/bar/baz.yaml",
				conditionField: "uesio/studio.collection",
				conditions: BundleConditions{
					"uesio/studio.collection": "luigi/foo.bar",
				},
			},
			true,
		},
		{
			"multi-value condition in BundleConditions - no match",
			args{
				path:           "luigi/foo/bar/baz.yaml",
				conditionField: "uesio/studio.collection",
				conditions: BundleConditions{
					"uesio/studio.collection": []string{
						"uesio/crm.account",
						"uesio/crm.contact",
					},
				},
			},
			false,
		},
		{
			"multi-value condition in BundleConditions - match",
			args{
				path:           "luigi/foo/bar/baz.yaml",
				conditionField: "uesio/studio.collection",
				conditions: BundleConditions{
					"uesio/studio.collection": []string{
						"uesio/crm.account",
						"luigi/foo.bar",
						"uesio/crm.contact",
					},
				},
			},
			true,
		},
		{
			"multi-value condition in BundleConditions - NO match",
			args{
				path:           "luigi/foo/bar/baz.yaml",
				conditionField: "uesio/studio.collection",
				conditions: BundleConditions{
					"uesio/studio.collection": []string{
						"luigi/foo.boo",
						"luigi/foo.baz",
						"luigi/foo.baa",
					},
				},
			},
			false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, GroupedPathFilter(tt.args.path, tt.args.conditionField, tt.args.conditions), "GroupedPathFilter(%v, %v, %v)", tt.args.path, tt.args.conditionField, tt.args.conditions)
		})
	}
}

package systemdialect

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func Test_sortItems(t *testing.T) {

	now := time.Now()
	coll := adapt.Collection{}
	itemA := coll.NewItem()
	itemA.SetField("uesio/studio.name", "alpha")
	itemA.SetField("uesio/core.updatedat", now.Add(-time.Hour*12).Unix())
	itemB := coll.NewItem()
	itemB.SetField("uesio/studio.name", "beta")
	itemB.SetField("uesio/core.updatedat", now.Add(-time.Hour*4).Unix())
	itemC := coll.NewItem()
	itemC.SetField("uesio/studio.name", "delta")
	itemC.SetField("uesio/core.updatedat", now.Add(-time.Hour*8).Unix())
	itemD := coll.NewItem()
	itemD.SetField("uesio/studio.name", "gamma")
	itemD.SetField("uesio/core.updatedat", now.Add(-time.Hour*8).Unix())

	type args struct {
		items     []meta.Item
		orderings []adapt.LoadRequestOrder
		expect    []meta.Item
	}
	tests := []struct {
		name string
		args args
	}{
		{
			"sort by a string field - ascending",
			args{
				[]meta.Item{
					itemD, itemB, itemC, itemA,
				},
				[]adapt.LoadRequestOrder{
					{
						Field: "uesio/studio.name",
						Desc:  false,
					},
				},
				[]meta.Item{
					itemA, itemB, itemC, itemD,
				},
			},
		},
		{
			"sort by a string field - descending",
			args{
				[]meta.Item{
					itemD, itemB, itemC, itemA,
				},
				[]adapt.LoadRequestOrder{
					{
						Field: "uesio/studio.name",
						Desc:  true,
					},
				},
				[]meta.Item{
					itemD, itemC, itemB, itemA,
				},
			},
		},
		{
			"sort by a timestamp field - ascending",
			args{
				[]meta.Item{
					itemD, itemB, itemC, itemA,
				},
				[]adapt.LoadRequestOrder{
					{
						Field: "uesio/core.updatedat",
						Desc:  false,
					},
					{
						Field: "uesio/studio.name",
						Desc:  false,
					},
				},
				[]meta.Item{
					itemA, itemC, itemD, itemB,
				},
			},
		},
		{
			"sort by a timestamp field - descending",
			args{
				[]meta.Item{
					itemD, itemB, itemC, itemA,
				},
				[]adapt.LoadRequestOrder{
					{
						Field: "uesio/core.updatedat",
						Desc:  true,
					},
					{
						Field: "uesio/studio.name",
						Desc:  false,
					},
				},
				[]meta.Item{
					itemB, itemC, itemD, itemA,
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sortItems(tt.args.items, tt.args.orderings)
			for i, v := range tt.args.expect {
				assert.Equal(t, tt.args.items[i], v)
			}
		})
	}
}

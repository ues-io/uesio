package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type DeleteAPI struct {
	delete *adapt.ChangeItem
}

func (d *DeleteAPI) GetOld(fieldName string) interface{} {
	if d.delete.OldValues == nil {
		return nil
	}
	val, err := d.delete.OldValues.GetField(fieldName)
	if err != nil {
		return nil
	}
	return val
}

package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type DeleteAPI struct {
	delete *wire.ChangeItem
	errors []string
}

func (d *DeleteAPI) GetId() string {
	return d.delete.IDValue
}

func (d *DeleteAPI) GetOld(fieldName string) interface{} {
	if fieldName == commonfields.Id {
		return d.GetId()
	}
	if d.delete.OldValues == nil {
		return nil
	}
	val, err := d.delete.OldValues.GetField(fieldName)
	if err != nil {
		return nil
	}
	return val
}

func (d *DeleteAPI) AddError(message string) {
	d.errors = append(d.errors, message)
}

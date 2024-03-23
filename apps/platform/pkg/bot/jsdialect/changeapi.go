package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type ChangeAPI struct {
	change *wire.ChangeItem
	op     *wire.SaveOp
}

func (c *ChangeAPI) GetId() string {
	return c.change.IDValue
}

func (c *ChangeAPI) Get(fieldName string) interface{} {
	val, err := c.change.FieldChanges.GetField(fieldName)
	if err != nil {
		return c.GetOld(fieldName)
	}
	return val
}

func (c *ChangeAPI) GetAll() map[string]interface{} {
	allChanges := map[string]interface{}{}
	c.change.FieldChanges.Loop(func(field string, value interface{}) error {
		allChanges[field] = value
		return nil
	})
	return allChanges
}

func (c *ChangeAPI) GetOld(fieldName string) interface{} {
	if c.change.OldValues == nil {
		return nil
	}
	val, err := c.change.OldValues.GetField(fieldName)
	if err != nil {
		return nil
	}
	return val
}

func (c *ChangeAPI) Set(fieldName string, value interface{}) {
	if err := c.change.FieldChanges.SetField(fieldName, value); err != nil {
		c.AddFieldError(err.Error(), fieldName)
	}
}

func (c *ChangeAPI) SetAll(record map[string]interface{}) {
	for field, value := range record {
		c.Set(field, value)
	}
}

func (c *ChangeAPI) AddError(message string) {
	c.op.AddError(exceptions.NewSaveException(c.change.IDValue, "", message))
}

func (c *ChangeAPI) AddFieldError(message string, field string) {
	c.op.AddError(exceptions.NewSaveException(c.change.IDValue, field, message))
}

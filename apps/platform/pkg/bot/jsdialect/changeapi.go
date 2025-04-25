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

func (c *ChangeAPI) Get(fieldName string) any {
	val, err := c.change.FieldChanges.GetField(fieldName)
	if err != nil {
		return c.GetOld(fieldName)
	}
	return val
}

func (c *ChangeAPI) GetAll() map[string]any {
	allChanges := map[string]any{}
	c.change.FieldChanges.Loop(func(field string, value any) error {
		allChanges[field] = value
		return nil
	})
	return allChanges
}

func (c *ChangeAPI) GetOld(fieldName string) any {
	if c.change.OldValues == nil {
		return nil
	}
	val, err := c.change.OldValues.GetField(fieldName)
	if err != nil {
		return nil
	}
	return val
}

func (c *ChangeAPI) Set(fieldName string, value any) {
	if err := c.change.FieldChanges.SetField(fieldName, value); err != nil {
		c.AddFieldError(err.Error(), fieldName)
	}
}

func (c *ChangeAPI) SetAll(record map[string]any) {
	for field, value := range record {
		c.Set(field, value)
	}
}

func (c *ChangeAPI) AddError(message string) {
	c.op.AddError(exceptions.NewSaveException(c.change.IDValue, "", message, nil))
}

func (c *ChangeAPI) AddFieldError(message string, field string) {
	c.op.AddError(exceptions.NewSaveException(c.change.IDValue, field, message, nil))
}

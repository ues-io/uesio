package jsdialect

import (
	"fmt"

	"github.com/dop251/goja"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Logger function
func Logger(message string) {
	fmt.Println(message)
}

// JSDialect struct
type JSDialect struct {
}

func (b *JSDialect) BeforeInsert(bot *meta.Bot, botAPI *datasource.BeforeInsertAPI, session *sess.Session) error {

	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	vm.Set("log", Logger)

	runner, err := vm.RunString("(" + bot.FileContents + ")")
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return err
	}

	_, err = change(goja.Undefined(), vm.ToValue(botAPI))
	if err != nil {
		if jserr, ok := err.(*goja.Exception); ok {
			botAPI.AddError(jserr.Error())
		} else {
			// Not a Javascript error
			return err
		}

	}

	return nil
}
func (b *JSDialect) BeforeUpdate(bot *meta.Bot, botAPI *datasource.BeforeUpdateAPI, session *sess.Session) error {

	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	vm.Set("log", Logger)

	runner, err := vm.RunString("(" + bot.FileContents + ")")
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return err
	}

	_, err = change(goja.Undefined(), vm.ToValue(botAPI))
	if err != nil {
		if jserr, ok := err.(*goja.Exception); ok {
			botAPI.AddError(jserr.Error())
		} else {
			// Not a Javascript error
			return err
		}

	}

	return nil
}
func (b *JSDialect) BeforeDelete(bot *meta.Bot, botAPI *datasource.BeforeDeleteAPI, session *sess.Session) error {

	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	vm.Set("log", Logger)

	runner, err := vm.RunString("(" + bot.FileContents + ")")
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return err
	}

	_, err = change(goja.Undefined(), vm.ToValue(botAPI))
	if err != nil {
		if jserr, ok := err.(*goja.Exception); ok {
			botAPI.AddError(jserr.Error())
		} else {
			// Not a Javascript error
			return err
		}

	}

	return nil
}
func (b *JSDialect) AfterInsert(bot *meta.Bot, botAPI *datasource.AfterInsertAPI, session *sess.Session) error {

	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	vm.Set("log", Logger)

	runner, err := vm.RunString("(" + bot.FileContents + ")")
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return err
	}

	_, err = change(goja.Undefined(), vm.ToValue(botAPI))
	if err != nil {
		if jserr, ok := err.(*goja.Exception); ok {
			botAPI.AddError(jserr.Error())
		} else {
			// Not a Javascript error
			return err
		}

	}

	return nil
}
func (b *JSDialect) AfterUpdate(bot *meta.Bot, botAPI *datasource.AfterUpdateAPI, session *sess.Session) error {

	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	vm.Set("log", Logger)

	runner, err := vm.RunString("(" + bot.FileContents + ")")
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return err
	}

	_, err = change(goja.Undefined(), vm.ToValue(botAPI))
	if err != nil {
		if jserr, ok := err.(*goja.Exception); ok {
			botAPI.AddError(jserr.Error())
		} else {
			// Not a Javascript error
			return err
		}

	}

	return nil
}
func (b *JSDialect) AfterDelete(bot *meta.Bot, botAPI *datasource.AfterDeleteAPI, session *sess.Session) error {

	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	vm.Set("log", Logger)

	runner, err := vm.RunString("(" + bot.FileContents + ")")
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return err
	}

	_, err = change(goja.Undefined(), vm.ToValue(botAPI))
	if err != nil {
		if jserr, ok := err.(*goja.Exception); ok {
			botAPI.AddError(jserr.Error())
		} else {
			// Not a Javascript error
			return err
		}

	}

	return nil
}

// CallBot function
func (b *JSDialect) CallBot(bot *meta.Bot, botAPI *datasource.CallBotAPI, session *sess.Session) error {
	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	vm.Set("log", Logger)

	runner, err := vm.RunString("(" + bot.FileContents + ")")
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return err
	}

	_, err = change(goja.Undefined(), vm.ToValue(botAPI))
	if err != nil {
		return err
	}
	return nil
}

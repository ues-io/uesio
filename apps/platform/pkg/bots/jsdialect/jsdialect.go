package jsdialect

import (
	"fmt"

	"github.com/dop251/goja"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Logger function
func Logger(message string) {
	fmt.Println(message)
}

// JSDialect struct
type JSDialect struct {
}

// BeforeSave function
func (b *JSDialect) BeforeSave(bot *metadata.Bot, botAPI *datasource.BeforeSaveAPI, session *sess.Session) error {

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

// AfterSave function
func (b *JSDialect) AfterSave(bot *metadata.Bot, botAPI *datasource.AfterSaveAPI, session *sess.Session) error {

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
func (b *JSDialect) CallBot(bot *metadata.Bot, botAPI *datasource.CallBotAPI, session *sess.Session) error {
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

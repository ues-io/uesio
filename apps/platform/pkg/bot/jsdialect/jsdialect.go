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

func runBot(contents string, api interface{}, errorFunc func(string)) error {
	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	err := vm.Set("log", Logger)
	if err != nil {
		return err
	}

	runner, err := vm.RunString("(" + contents + ")")
	if err != nil {
		return err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return err
	}

	_, err = change(goja.Undefined(), vm.ToValue(api))
	if err != nil {
		if errorFunc == nil {
			return err
		}
		if jserr, ok := err.(*goja.Exception); ok {
			errorFunc(jserr.Error())
		} else {
			// Not a Javascript error
			return err
		}

	}

	return nil
}

func (b *JSDialect) BeforeInsert(bot *meta.Bot, botAPI *datasource.BeforeInsertAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, botAPI.AddError)
}

func (b *JSDialect) BeforeUpdate(bot *meta.Bot, botAPI *datasource.BeforeUpdateAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, botAPI.AddError)
}

func (b *JSDialect) BeforeDelete(bot *meta.Bot, botAPI *datasource.BeforeDeleteAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, botAPI.AddError)
}

func (b *JSDialect) AfterInsert(bot *meta.Bot, botAPI *datasource.AfterInsertAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, botAPI.AddError)
}

func (b *JSDialect) AfterUpdate(bot *meta.Bot, botAPI *datasource.AfterUpdateAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, botAPI.AddError)
}
func (b *JSDialect) AfterDelete(bot *meta.Bot, botAPI *datasource.AfterDeleteAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, botAPI.AddError)
}

func (b *JSDialect) CallBot(bot *meta.Bot, botAPI *datasource.CallBotAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, nil)
}

package jsdialect

import (
	"fmt"
	"time"

	"github.com/dop251/goja"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func Logger(message string) {
	fmt.Println(message)
}

type JSDialect struct {
}

const MAX_SECONDS time.Duration = 5

func runBot(botName string, contents string, api interface{}, errorFunc func(string)) error {
	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	err := vm.Set("log", Logger)
	if err != nil {
		return err
	}

	time.AfterFunc(MAX_SECONDS*time.Second, func() {
		vm.Interrupt("Bot: " + botName + " is running too long, please check your code and run the operation again.")
		return //Interrupt native Go functions
	})

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

func (b *JSDialect) BeforeSave(bot *meta.Bot, botAPI *datasource.BeforeSaveAPI) error {
	return runBot(bot.Name, bot.FileContents, botAPI, botAPI.AddError)
}

func (b *JSDialect) AfterSave(bot *meta.Bot, botAPI *datasource.AfterSaveAPI) error {
	return runBot(bot.Name, bot.FileContents, botAPI, botAPI.AddError)
}

func (b *JSDialect) CallBot(bot *meta.Bot, botAPI *datasource.CallBotAPI) error {
	return runBot(bot.Name, bot.FileContents, botAPI, nil)
}

func (b *JSDialect) CallGeneratorBot(bot *meta.Bot, botAPI *datasource.GeneratorBotAPI) error {
	return runBot(bot.Name, bot.FileContents, botAPI, nil)
}

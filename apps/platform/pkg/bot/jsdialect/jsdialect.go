package jsdialect

import (
	"errors"
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

func runBot(botName string, contents string, api interface{}, errorFunc func(string)) (map[string]interface{}, error) {
	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	err := vm.Set("log", Logger)
	if err != nil {
		return nil, err
	}

	time.AfterFunc(MAX_SECONDS*time.Second, func() {
		vm.Interrupt("Bot: " + botName + " is running too long, please check your code and run the operation again.")
		return //Interrupt native Go functions
	})

	runner, err := vm.RunString("(" + contents + ")")
	if err != nil {
		return nil, err
	}
	change, ok := goja.AssertFunction(runner)
	if !ok {
		return nil, err
	}

	resultsValue, err := change(goja.Undefined(), vm.ToValue(api))

	if err != nil {
		if errorFunc == nil {
			return nil, err
		}
		if jserr, ok := err.(*goja.Exception); ok {
			errorFunc(jserr.Error())
		} else {
			// Not a Javascript error
			return nil, err
		}
	}

	// If there is no result value, we are done
	if resultsValue == nil {
		return nil, nil
	}

	// Otherwise, attempt to convert into a JavaScript object
	resultsMap := make(map[string]interface{})

	err = vm.ExportTo(resultsValue, &resultsMap)

	// Convert the Goja result into a map. If it fails, return an error
	if err != nil {
		return nil, errors.New("Bot results must be a JavaScript object")
	}

	return resultsMap, nil
}

func (b *JSDialect) BeforeSave(bot *meta.Bot, botAPI *datasource.BeforeSaveAPI) error {
	_, err := runBot(bot.Name, bot.FileContents, botAPI, botAPI.AddError)
	return err
}

func (b *JSDialect) AfterSave(bot *meta.Bot, botAPI *datasource.AfterSaveAPI) error {
	_, err := runBot(bot.Name, bot.FileContents, botAPI, botAPI.AddError)
	return err
}

func (b *JSDialect) CallBot(bot *meta.Bot, botAPI *datasource.CallBotAPI) (map[string]interface{}, error) {
	return runBot(bot.Name, bot.FileContents, botAPI, nil)
}

func (b *JSDialect) CallGeneratorBot(bot *meta.Bot, botAPI *datasource.GeneratorBotAPI) error {
	_, err := runBot(bot.Name, bot.FileContents, botAPI, nil)
	return err
}

package tsdialect

import (
	"errors"
	"fmt"

	"github.com/dop251/goja"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"

	esbuild "github.com/evanw/esbuild/pkg/api"
)

type Console struct {
}

func (c *Console) Log(message string) {
	fmt.Println(message)
}

// TSDialect struct
type TSDialect struct {
}

func getBotProgram(bot *meta.Bot) (*goja.Program, error) {

	program, ok := GetBotFromCache(bot.ID, bot.UpdatedAt)
	if ok {
		return program, nil
	}

	result := esbuild.Transform(bot.FileContents, esbuild.TransformOptions{
		Loader: esbuild.LoaderTS,
	})

	if len(result.Errors) != 0 {
		return nil, errors.New("Transpile Code Error")
	}

	js := string(result.Code)

	program, err := goja.Compile("BotTestName", "("+js+")", true)

	if err != nil {
		return nil, errors.New("Compile Code Error: " + err.Error())
	}

	AddBotToCache(program, bot.ID, bot.UpdatedAt)

	return program, nil

}

func runBot(program *goja.Program, api interface{}, errorFunc func(string)) error {
	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	err := vm.Set("console", &Console{})
	if err != nil {
		return err
	}

	runner, err := vm.RunProgram(program)
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

func (b *TSDialect) BeforeSave(bot *meta.Bot, botAPI *datasource.BeforeSaveAPI, session *sess.Session) error {
	program, err := getBotProgram(bot)
	if err != nil {
		return err
	}

	return runBot(program, botAPI, botAPI.AddError)
}

func (b *TSDialect) AfterSave(bot *meta.Bot, botAPI *datasource.AfterSaveAPI, session *sess.Session) error {
	program, err := getBotProgram(bot)
	if err != nil {
		return err
	}

	return runBot(program, botAPI, botAPI.AddError)
}

func (b *TSDialect) CallBot(bot *meta.Bot, botAPI *datasource.CallBotAPI, session *sess.Session) error {
	program, err := getBotProgram(bot)
	if err != nil {
		return err
	}

	return runBot(program, botAPI, nil)
}

func (b *TSDialect) CallGeneratorBot(bot *meta.Bot, botAPI *datasource.GeneratorBotAPI, session *sess.Session) error {
	program, err := getBotProgram(bot)
	if err != nil {
		return err
	}

	return runBot(program, botAPI, nil)
}

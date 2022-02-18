package tsdialect

import (
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

func runBot(contents string, api interface{}, errorFunc func(string)) error {
	// TODO: We could possibly not start a new VM for every bot we run.
	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	err := vm.Set("console", &Console{})
	if err != nil {
		return err
	}

	result := esbuild.Transform(contents, esbuild.TransformOptions{
		Loader: esbuild.LoaderTS,
	})

	if len(result.Errors) != 0 {
		return err
	}

	js := string(result.Code)

	runner, err := vm.RunString("(" + js + ")")
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
	return runBot(bot.FileContents, botAPI, botAPI.AddError)
}

func (b *TSDialect) AfterSave(bot *meta.Bot, botAPI *datasource.AfterSaveAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, botAPI.AddError)
}

func (b *TSDialect) CallBot(bot *meta.Bot, botAPI *datasource.CallBotAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, nil)
}

func (b *TSDialect) CallGeneratorBot(bot *meta.Bot, botAPI *datasource.GeneratorBotAPI, session *sess.Session) error {
	return runBot(bot.FileContents, botAPI, nil)
}

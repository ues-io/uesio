package bots

import (
	"errors"
	"fmt"

	"github.com/dop251/goja"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// Logger function
func Logger(message string) {
	fmt.Println(message)
}

// RunBot function
func RunBot(bot *metadata.Bot, request *reqs.SaveRequest, botAPI *BotAPI, vm *goja.Runtime, site *metadata.Site, sess *session.Session) error {

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

// RunBots function
func RunBots(bots metadata.BotCollection, request *reqs.SaveRequest, collectionMetadata *adapters.CollectionMetadata, site *metadata.Site, sess *session.Session) error {

	botAPI := &BotAPI{
		Changes: &ChangesAPI{
			changes:  request.Changes,
			metadata: collectionMetadata,
		},
	}

	vm := goja.New()
	vm.SetFieldNameMapper(goja.TagFieldNameMapper("bot", true))
	vm.Set("log", Logger)

	for _, bot := range bots {
		if bot.CollectionRef != request.Collection {
			continue
		}
		err := RunBot(&bot, request, botAPI, vm, site, sess)
		if err != nil {
			return err
		}
	}

	if botAPI.HasErrors() {
		return errors.New(botAPI.GetErrorString())
	}

	return nil
}

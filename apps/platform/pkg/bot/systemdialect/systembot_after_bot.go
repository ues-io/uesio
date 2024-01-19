package systemdialect

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bot"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getKeyBotInfo(change *wire.ChangeItem) (botName, botType, botDialect string, err error) {
	botName, err = change.GetFieldAsString("uesio/studio.name")
	if err != nil {
		return "", "", "", err
	}
	botDialect, err = change.GetFieldAsString("uesio/studio.dialect")
	if err != nil {
		return "", "", "", err
	}
	botType, err = change.GetFieldAsString("uesio/studio.type")
	if err != nil {
		return "", "", "", err
	}
	return botName, botType, botDialect, nil
}

func runBotAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	var fileUploadOps []*filesource.FileUploadOp

	// Pre-create an Attachment file for the new Bot's contents
	var err = request.LoopInserts(func(change *wire.ChangeItem) error {
		botName, botType, botDialect, err := getKeyBotInfo(change)
		if err != nil {
			return err
		}
		// Lookup the BotDialect object
		dialectObject, err := bot.GetBotDialect(botDialect)
		if err != nil {
			return err
		}
		defaultText := dialectObject.GetDefaultFileBody(botType)
		if defaultText != "" {
			defaultText = fmt.Sprintf(defaultText, botName)
		}

		newFileUpload := filesource.FileUploadOp{
			Data:          strings.NewReader(defaultText),
			ContentLength: int64(len(defaultText)),
			Path:          dialectObject.GetFilePath(),
			CollectionID:  "uesio/studio.bot",
			RecordID:      change.IDValue,
		}

		fileUploadOps = append(fileUploadOps, &newFileUpload)

		return nil
	})
	if err != nil {
		return err
	}

	// Upload all files, if there are any
	if len(fileUploadOps) == 0 {
		return nil
	}

	_, err = filesource.Upload(fileUploadOps, connection, session, request.Params)
	if err != nil {
		return err
	}

	return nil

}

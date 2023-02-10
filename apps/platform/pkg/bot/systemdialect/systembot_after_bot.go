package systemdialect

import (
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bot"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"strings"
)

func runBotAfterSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	fileUploadOps := []filesource.FileUploadOp{}

	// Pre-create an Attachment file for the new Bot
	var err = request.LoopInserts(func(change *adapt.ChangeItem) error {

		botName, err := change.GetFieldAsString("uesio/studio.name")
		if err != nil {
			return err
		}
		botDialect, err := change.GetFieldAsString("uesio/studio.dialect")
		if err != nil {
			return err
		}
		botType, err := change.GetFieldAsString("uesio/studio.type")
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
			Data: strings.NewReader(defaultText),
			Details: &fileadapt.FileDetails{
				ContentLength: int64(len(defaultText)),
				Path:          dialectObject.GetFilePath(),
				CollectionID:  "uesio/studio.bot",
				RecordID:      change.IDValue,
			},
		}

		fileUploadOps = append(fileUploadOps, newFileUpload)

		return nil
	})
	if err != nil {
		return err
	}

	// Upload all default bot files, if there are any
	if len(fileUploadOps) == 0 {
		return nil
	}

	_, err = filesource.Upload(fileUploadOps, connection, session)
	if err != nil {
		return err
	}

	return nil

}

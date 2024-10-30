package usage_common

import (
	"fmt"
	"log/slog"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func SaveBatch(usage meta.UsageCollection, session *sess.Session) error {

	if len(usage) == 0 {
		return nil
	}

	requests := []datasource.SaveRequest{
		{
			Collection: "uesio/studio.usage",
			Wire:       "CoolWireName",
			Changes:    &usage,
			Options:    &wire.SaveOptions{Upsert: true},
		},
	}

	err := datasource.SaveWithOptions(requests, session, nil)
	if err != nil {
		return fmt.Errorf("Failed to update usage events: %w : %v", err, len(usage))
	}

	slog.Info(fmt.Sprintf("Successfully processed %d usage events", len(usage)))
	return nil

}

func GetUsageItem(key, value string) *meta.Usage {
	// Make sure the value was actually there
	if key == "nil" {
		return nil
	}
	keyParts := strings.Split(key, ":")
	if len(keyParts) != 9 {
		slog.Error("Usage key did not match expected pattern: " + key)
		return nil
	}

	tenantType := keyParts[1]
	if tenantType != "site" {
		return nil
	}

	//tenantID eq Site UniqueKey
	tenantID := fmt.Sprintf("%s:%s", keyParts[2], keyParts[3])

	usageItem := &meta.Usage{
		User:         keyParts[4],
		Day:          keyParts[5],
		ActionType:   keyParts[6],
		MetadataType: keyParts[7],
		MetadataName: keyParts[8],
		App: &meta.App{
			BuiltIn: meta.BuiltIn{
				UniqueKey: keyParts[2],
			},
		},
		Site: &meta.Site{
			BuiltIn: meta.BuiltIn{
				UniqueKey: tenantID,
			},
		},
	}

	total, _ := strconv.ParseInt(value, 10, 64)
	usageItem.SetField("uesio/studio.total", total)
	return usageItem
}

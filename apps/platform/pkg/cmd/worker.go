package cmd

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gomodule/redigo/redis"
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func init() {

	rootCmd.AddCommand(&cobra.Command{
		Use:   "work",
		Short: "uesio work",
		Run:   worker,
	})

}

func worker(cmd *cobra.Command, args []string) {

	logger.Log("Running uesio worker", logger.INFO)

	err := InvoicingJob()
	if err != nil {
		logger.Log("Invoicing Job failed reason: "+err.Error(), logger.ERROR)
	}

	// for {
	// 	err := UsageJob()
	// 	if err != nil {
	// 		logger.Log("Usage Job failed reason: "+err.Error(), logger.ERROR)
	// 	}
	// 	time.Sleep(5 * time.Second)
	// }

}

func UsageJob() error {

	logger.Log("Usage Job Running", logger.INFO)

	conn := cache.GetRedisConn()
	defer conn.Close()

	keys, err := redis.Strings(conn.Do("SMEMBERS", "USAGE_KEYS"))
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	if len(keys) == 0 {
		return nil
	}

	keyArgs := redis.Args{}.AddFlat(keys)

	values, err := redis.Strings(conn.Do("MGET", keyArgs...))
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	_, err = conn.Do("DEL", keyArgs...)
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	_, err = conn.Do("DEL", "USAGE_KEYS")
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	changes := adapt.Collection{}
	for i, key := range keys {
		keyParts := strings.Split(key, ":")
		if len(keyParts) != 9 {
			return fmt.Errorf("Error Getting Usage Event: " + err.Error())
		}

		tenantType := keyParts[1]
		if tenantType != "site" {
			continue
		}

		//tenantID eq Site UniqueKey
		tenantID := fmt.Sprintf("%s:%s", keyParts[2], keyParts[3])

		day := keyParts[5]
		dayInISOformat, _ := time.Parse("2006-01-02", day)

		usageItem := adapt.Item{}
		usageItem.SetField("uesio/studio.user", keyParts[4])
		usageItem.SetField("uesio/studio.day", day)
		usageItem.SetField("uesio/studio.timestamp", dayInISOformat.UnixMilli())
		usageItem.SetField("uesio/studio.actiontype", keyParts[6])
		usageItem.SetField("uesio/studio.metadatatype", keyParts[7])
		usageItem.SetField("uesio/studio.metadataname", keyParts[8])
		usageItem.SetField("uesio/studio.app", &meta.App{
			UniqueKey: keyParts[2],
		})
		usageItem.SetField("uesio/studio.site", &meta.Site{
			UniqueKey: tenantID,
		})
		total, _ := strconv.ParseFloat(values[i], 64)
		usageItem.SetField("uesio/studio.total", total)
		changes = append(changes, &usageItem)

	}

	if len(changes) > 0 {

		session, err := auth.GetStudioSystemSession(nil)
		if err != nil {
			return err
		}

		requests := []datasource.SaveRequest{
			{
				Collection: "uesio/studio.usage",
				Wire:       "CoolWireName",
				Changes:    &changes,
				Options:    &adapt.SaveOptions{Upsert: true},
			},
		}

		err = datasource.SaveWithOptions(requests, session, nil)
		if err != nil {
			return errors.New("Failed to update usage events: " + err.Error())
		}
	}

	logger.Log("Job completed without any issues", logger.INFO)
	return nil
}

func InvoicingJob() error {

	logger.Log("Invoicing Job Running", logger.INFO)

	session, err := auth.GetStudioSystemSession(nil)
	if err != nil {
		return err
	}

	var apps meta.AppCollection
	err = datasource.PlatformLoad(&apps, nil, session)
	if err != nil {
		return err
	}

	apps.Loop(func(item meta.Item, _ string) error {
		uniqueKey, err := item.GetField(adapt.UNIQUE_KEY_FIELD)
		if err != nil {
			return err
		}

		uniqueKeyAsString, ok := uniqueKey.(string)
		if !ok {
			return errors.New("uniqueKey must be a string")
		}

		logger.Log("Creating invoice for: "+uniqueKeyAsString, logger.INFO)

		params := map[string]interface{}{"appID": uniqueKeyAsString}
		err = datasource.RunCreateInvoiceListenerBot(params, nil, session)

		if err != nil {
			logger.Log("Error creating invoice for: "+uniqueKeyAsString, logger.ERROR)
			return err
		}

		return nil
	})

	return nil
}

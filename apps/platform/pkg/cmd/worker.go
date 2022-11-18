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

	for {
		err := UsageJob()
		if err != nil {
			logger.Log("Usage Job failed reason: "+err.Error(), logger.ERROR)
		}
		time.Sleep(5 * time.Second)
	}

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

	changesByTenant := map[string]adapt.Collection{}

	for i, key := range keys {
		keyParts := strings.Split(key, ":")
		if len(keyParts) != 9 {
			return fmt.Errorf("Error Getting Usage Event: " + err.Error())
		}

		tenantType := keyParts[1]
		if tenantType != "site" {
			continue
		}

		tenantID := fmt.Sprintf("%s:%s", keyParts[2], keyParts[3])

		_, ok := changesByTenant[tenantID]
		if !ok {
			changesByTenant[tenantID] = adapt.Collection{}
		}

		usageItem := adapt.Item{}
		usageItem.SetField("uesio/studio.user", &meta.User{
			ID: keyParts[4],
		})
		usageItem.SetField("uesio/studio.day", keyParts[5])
		usageItem.SetField("uesio/studio.actiontype", keyParts[6])
		usageItem.SetField("uesio/studio.metadatatype", keyParts[7])
		usageItem.SetField("uesio/studio.metadataname", keyParts[8])
		total, _ := strconv.ParseFloat(values[i], 64)
		usageItem.SetField("uesio/studio.total", total)
		changesByTenant[tenantID] = append(changesByTenant[tenantID], &usageItem)
	}

	for siteKey, changes := range changesByTenant {
		if len(changes) > 0 {

			inContextSession, err := auth.GetSystemSessionByKey(siteKey, nil)
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

			err = datasource.SaveWithOptions(requests, inContextSession, nil)
			if err != nil {
				return errors.New("Failed to update usage events: " + err.Error())
			}
		}
	}

	logger.Log("Job completed without any issues", logger.INFO)
	return nil
}

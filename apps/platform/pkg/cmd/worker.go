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

		tenantID := fmt.Sprintf("%s:%s", keyParts[2], keyParts[3])

		usageItem := adapt.Item{}
		usageItem.SetField("uesio/core.user", &meta.User{
			ID: keyParts[4],
		})
		usageItem.SetField("uesio/core.day", keyParts[5])
		usageItem.SetField("uesio/core.actiontype", keyParts[6])
		usageItem.SetField("uesio/core.metadatatype", keyParts[7])
		usageItem.SetField("uesio/core.metadataname", keyParts[8])
		usageItem.SetField("uesio/core.tenantid", tenantID)
		//TO-DO
		appkey := fmt.Sprintf("%s:%s:%s:%s", "appName", keyParts[6], keyParts[7], keyParts[8])
		usageItem.SetField("uesio/core.appkey", appkey)

		total, _ := strconv.ParseFloat(values[i], 64)
		usageItem.SetField("uesio/core.total", total)

		changes = append(changes, &usageItem)

	}

	if len(changes) > 0 {

		requests := []datasource.SaveRequest{
			{
				Collection: "uesio/core.usage",
				Wire:       "CoolWireName",
				Changes:    &changes,
				Options:    &adapt.SaveOptions{Upsert: true},
			},
		}

		err = datasource.SaveWithOptions(requests, LOOOK_FOR_ME, nil)
		if err != nil {
			return errors.New("Failed to update usage events: " + err.Error())
		}
	}

	logger.Log("Job completed without any issues", logger.INFO)
	return nil
}

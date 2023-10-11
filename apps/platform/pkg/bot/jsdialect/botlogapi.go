package jsdialect

import (
	"encoding/json"
	"fmt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"log"
	"strings"
	"sync/atomic"
	"time"
)

type BotLogAPI struct {
	bot     *meta.Bot
	counter uint64
	start   time.Time
}

func NewBotLogAPI(bot *meta.Bot) *BotLogAPI {
	return &BotLogAPI{
		bot:     bot,
		counter: 0,
		start:   time.Now(),
	}
}

// BotLogEntry defines a bot logging entry
type BotLogEntry struct {
	Message      string `json:"message"`
	Instant      string `json:"instant"`
	Sequence     uint64 `json:"sequence"`
	BotName      string `json:"botName"`
	BotNamespace string `json:"botNamespace"`
	Level        string `json:"level"`
	Elapsed      string `json:"elapsed"`
}

func (logapi *BotLogAPI) log(level, message string, data ...interface{}) {
	elapsed := time.Since(logapi.start)
	dataString := ""
	if len(data) > 0 {
		dataString = fmt.Sprintf(strings.Repeat(" %v", len(data)), data...)
	}
	logEntry := BotLogEntry{
		Elapsed:      fmt.Sprintf("%ds%dms", int64(elapsed.Seconds()), elapsed.Milliseconds()),
		Instant:      time.Now().Format(time.RFC3339),
		BotName:      logapi.bot.Name,
		BotNamespace: logapi.bot.Namespace,
		Level:        strings.ToUpper(level),
		Message:      message + dataString,
		Sequence:     atomic.AddUint64(&logapi.counter, 1),
	}
	logMessage, err := json.Marshal(logEntry)
	if err != nil {
		return
	}
	log.Println(string(logMessage))
}

func (logapi *BotLogAPI) Info(message string, data ...interface{}) {
	logapi.log("info", message, data)
}
func (logapi *BotLogAPI) Warn(message string, data ...interface{}) {
	logapi.log("warn", message, data)
}
func (logapi *BotLogAPI) Error(message string, data ...interface{}) {
	logapi.log("error", message, data)
}

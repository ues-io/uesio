package jsdialect

import (
	"context"
	"fmt"
	"log/slog"
	"sync/atomic"
	"time"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type BotLogAPI struct {
	bot     *meta.Bot
	counter uint64
	start   time.Time
	ctx     context.Context
}

func NewBotLogAPI(bot *meta.Bot, ctx context.Context) *BotLogAPI {
	return &BotLogAPI{
		bot:     bot,
		counter: 0,
		start:   time.Now(),
		ctx:     ctx,
	}
}

// BotLogEntry defines a bot logging entry
type BotLogEntry struct {
	Sequence     uint64      `json:"sequence"`
	BotName      string      `json:"name"`
	BotNamespace string      `json:"namespace"`
	Elapsed      string      `json:"elapsed"`
	Data         interface{} `json:"data,omitempty"`
}

// LogValue implements the LogValuer interface to define how this struct
// should be serialized by structured loggers
func (e *BotLogEntry) LogValue() slog.Value {
	var attrs []slog.Attr
	if e.Sequence != 0 {
		attrs = append(attrs, slog.Uint64("sequence", e.Sequence))
	}
	if e.Elapsed != "" {
		attrs = append(attrs, slog.String("elapsed", e.Elapsed))
	}
	if e.BotName != "" {
		attrs = append(attrs, slog.String("name", e.BotName))
	}
	if e.BotNamespace != "" {
		attrs = append(attrs, slog.String("namespace", e.BotNamespace))
	}
	// TODO: Obscure any data in here unless we are in local development, to prevent exposure of PII, etc.
	if e.Data != nil {
		attrs = append(attrs, slog.Any("data", e.Data))
	}
	return slog.GroupValue(attrs...)
}

func (logapi *BotLogAPI) log(level slog.Level, message string, data interface{}) {
	elapsed := time.Since(logapi.start)
	logEntry := BotLogEntry{
		Elapsed:      fmt.Sprintf("%ds%dms", int64(elapsed.Seconds()), elapsed.Milliseconds()),
		BotName:      logapi.bot.Name,
		BotNamespace: logapi.bot.Namespace,
		Data:         data,
		Sequence:     atomic.AddUint64(&logapi.counter, 1),
	}
	slog.Log(logapi.ctx, level, message, "bot", &logEntry)
}

func (logapi *BotLogAPI) Info(message string, data interface{}) {
	logapi.log(slog.LevelInfo, message, data)
}
func (logapi *BotLogAPI) Warn(message string, data interface{}) {
	logapi.log(slog.LevelWarn, message, data)
}
func (logapi *BotLogAPI) Error(message string, data interface{}) {
	logapi.log(slog.LevelError, message, data)
}

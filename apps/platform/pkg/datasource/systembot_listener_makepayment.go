package datasource

import (
	"errors"
	"strconv"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"
	"github.com/stripe/stripe-go/v74/price"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runMakePaymentListenerBot(params map[string]interface{}, connection adapt.Connection, uesioSession *sess.Session) (map[string]interface{}, error) {

	//stripe.Key = "sk_test_51MC1MmJKdGn0ZDEEKE3oc9O0YUz9bJMYNaABNf4perGEycxtHmRuqXpnUyA4vbuXwcN9hwJMSEt6E2mJCNGeuzBN00eic9IQ1m"
	//productID := "prod_MwHe3fVLMi0pcj"

	//BOT Start

	anonSession := sess.GetStudioAnonSession()
	stripeKey, err := secretstore.GetSecretFromKey("uesio/studio.stripe_key", anonSession)
	if err != nil {
		return nil, err
	}

	stripe.Key = stripeKey

	productID, err := configstore.GetValueFromKey("uesio/studio.stripe_product_id", anonSession)
	if err != nil {
		return nil, err
	}

	amount, err := strconv.ParseInt(params["price"].(string), 10, 64)
	if err != nil {
		return nil, errors.New("Can't get price")
	}

	newPriceParams := &stripe.PriceParams{
		Product:    stripe.String(productID),
		UnitAmount: stripe.Int64(amount),
		Currency:   stripe.String("usd"),
	}

	price, err := price.New(newPriceParams)
	if err != nil {
		return nil, err
	}

	oneTimePayment := &stripe.CheckoutSessionParams{
		ClientReferenceID: stripe.String("CLIENT_ID"),
		PaymentMethodTypes: stripe.StringSlice([]string{
			"card",
		}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(price.ID),
				Quantity: stripe.Int64(1),
			},
		},
		Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
		//SuccessURL: stripe.String("https://example.com/success?session_id={CHECKOUT_SESSION_ID}"),
		SuccessURL: stripe.String("https://studio.uesio-dev.com:3000/myprofile"),
		CancelURL:  stripe.String("https://example.com/cancel"),
	}

	checkoutSession, err := session.New(oneTimePayment)
	if err != nil {
		return nil, err
	}

	returnParams := map[string]interface{}{"url": checkoutSession.URL, "checkoutSessionID": checkoutSession.ID}

	return returnParams, nil

}

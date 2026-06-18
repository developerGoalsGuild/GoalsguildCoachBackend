import os
import json
import urllib.request
import urllib.parse
from _security import require_origin_secret
from _ssm_config import get_config_value

def handler(event, context):
    allowed, response = require_origin_secret(event)
    
    if not allowed:
        return response

    try:
        stripe_secret = get_config_value("STRIPE_SECRET_KEY_PARAM", "STRIPE_SECRET_KEY")
        price_id = get_config_value("STRIPE_PRICE_ID_PARAM", "STRIPE_PRICE_ID")
    except Exception as e:
        print(f"Error loading Stripe configuration from SSM: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Stripe configuration is missing"})
        }

    app_url = os.environ.get("FRONTEND_URL", "https://www.goalsguild.com")
    
    if not stripe_secret or not price_id:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Stripe configuration is missing"})
        }
        
    data = urllib.parse.urlencode({
        "mode": "payment",
        "line_items[0][price]": price_id,
        "line_items[0][quantity]": 1,
        "success_url": f"{app_url}/success.html?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{app_url}/checkout.html"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        "https://api.stripe.com/v1/checkout/sessions",
        data=data,
        headers={
            "Authorization": f"Bearer {stripe_secret}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            return {
                "statusCode": 302,
                "headers": {
                    "Location": res_body.get("url", app_url)
                }
            }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

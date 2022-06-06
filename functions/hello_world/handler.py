import json


def hello(event, context):
    body = {
        "message": "Hello World!",
        "input": event,
    }

    return {"statusCode": 200, "body": json.dumps(body)}

def reverse(event, context):    
    body = {
        "message": "hi! " + event[::-1],
        "original": event
    }

    return {"statusCode": 200, "body": json.dumps(body)}
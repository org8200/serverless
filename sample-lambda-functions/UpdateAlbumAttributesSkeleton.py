import json
import boto3
from decimal import Decimal
from botocore.exceptions import ClientError
import os

def lambda_handler(event, context):
    region=boto3.session.Session().region_name
    dynamodb = boto3.resource('dynamodb', region_name=region) #low-level Client
    table = dynamodb.Table(os.environ['tablename']) #define which dynamodb table to access

    try:
        response = table.???(
            Key={
                'Artist': event["Item"]["Artist"],
                'Album': event["Item"]["Album"]
            },
            ???="set Genre=:g, #R=:r, #Y=:y",
            ??? = { '#R' : "Rank", '#Y' : "Year" },
            ???={
               ':r': Decimal(event["Item"]["Rank"]),
               ':g': event["Item"]["Genre"],
               ':y': event["Item"]["Year"]
            },
            ReturnValues="UPDATED_NEW"
        )
        return response['Attributes']
    # handle error responses
    except ClientError as error:
        return ClientError
    except Exception as error:
        print(error)

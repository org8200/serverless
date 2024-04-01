import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
import os
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    region=boto3.session.Session().region_name
    dynamodb = boto3.resource('dynamodb', region_name=region) #low-level Client
    table = dynamodb.Table(os.environ['tablename']) #define which dynamodb table to access

    if len(event['Genre']) > 0:
        try:
            totallist = table.query(
            IndexName="genre-index",
            KeyConditionExpression=Key("Genre").eq(event['Genre'])   # a cleaner code snippet that leverages boto3's conditions classes
            )
        except ClientError as error:
            return error.response['Error']['Message']
        except BaseException as error:
            raise error
        return totallist['Items']
    else :
        try:
            scanreturn = table.scan()
            totallist = scanreturn['Items']

            while 'LastEvaluatedKey' in scanreturn.keys(): # if lastevaluatedkey is present, we need to keep scanning
                scanreturn = table.scan(
                    ExclusiveStartKey = scanreturn['LastEvaluatedKey']
                )
                totallist += scanreturn['Items']
            return totallist
        except ClientError as error:
            return error.response['Error']['Message']
        except Exception as error:
            print(error)
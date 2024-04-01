import boto3
import argparse

def create_new_dynamodb_table(namefortable):
  region=boto3.session.Session().region_name
  dynamodb = boto3.resource('dynamodb', region_name=region) #low-level client
  table = dynamodb.create_table(
    TableName=namefortable,
    KeySchema=[                                  # Specify the table keys
        {
            'AttributeName': 'Artist',
            'KeyType': 'HASH' #Partition Key
        },
        {
            'AttributeName': 'Album',
            'KeyType': 'RANGE' #Sort Key
        }
    ],
    AttributeDefinitions=[                      # Specify the other known table attributes
        {
            'AttributeName': 'Artist',
            'AttributeType': 'S'
        },
        {
            'AttributeName': 'Album',
            'AttributeType': 'S'
        },
        {
            'AttributeName': 'Genre',
            'AttributeType': 'S'
        }
    ],
    GlobalSecondaryIndexes=[                        #  Create the GSI on the Genre attribute
        {
            'IndexName': 'genre-index',
            'KeySchema': [
                {
                    'AttributeName': 'Genre',
                    'KeyType': 'HASH'
                },
            ],
            'Projection': {
                'ProjectionType': 'ALL',
            },
            'ProvisionedThroughput': {
                'ReadCapacityUnits': 100,
                'WriteCapacityUnits': 100
            }
        }
    ],
    ProvisionedThroughput={                          # Set a high throughput value for the purposes of the lab
        'ReadCapacityUnits': 100,
        'WriteCapacityUnits': 100
    }
  )
  return table

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("tablename", help="name of the dynamodb table to create")    # Get the name of the table to create as a command line argument
    args = parser.parse_args()
    result = create_new_dynamodb_table(args.tablename)
    print("Table status:", result.table_status)

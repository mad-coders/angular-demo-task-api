const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.delete = (event, context, callback) => {
    const params = {
        TableName: process.env.ORDER_TABLE,
        Key: {
            id: event.pathParameters.id,
        },
    };

    dynamoDb.get(params, (error, result) => {
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {'Content-Type': 'text/plain'},
                body: 'Couldn\'t fetch the orders.',
            });

            return;
        }

        if (!result.Item) {
            callback(null, {
                statusCode: 404,
                headers: {'Content-Type': 'text/plain'},
                body: 'Order id "' + id + '" has not been found',
            });

            return;
        }

        const item = result.Item;
        const status = item.status || 'closed';
        if (status === 'closed') {
            if (!result.Item) {
                callback(null, {
                    statusCode: 400,
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ errors: [ {message: "Order is already closed"} ]}),
                });

                return;
            }
        }

        dynamoDb.delete(params, (error) => {
            if (error) {
                console.error(error);
                callback(null, {
                    statusCode: error.statusCode || 501,
                    headers: {'Content-Type': 'application/hal+json'},
                    body: 'Couldn\'t remove the todo item.',
                });

                return;
            }

            const response = {
                statusCode: 204,
                headers: {'Content-Type': 'application/hal+json'},
                body: '',
            };

            callback(null, response);
        });
    });
};

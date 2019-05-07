const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const Validator = require('./validator');
const hal = require('hal');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.update = (event, context, callback) => {
    const data = JSON.parse(event.body);
    const baseUrl = process.env.BASE_API_URL || 'https://' + event.headers.Host + '/' + event.requestContext.stage;
    const id = event.pathParameters.id;

    const errors = Validator.validate(data);
    if (errors && errors.length) {
        console.error('Validation Failed', errors);
        callback(null, {
            statusCode: 400,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({errors: errors}),
        });

        return;
    }

    const fetchParams = {
        TableName: process.env.ORDER_TABLE,
        Key: {
            id: id,
        },
    };

    dynamoDb.get(fetchParams, (error, result) => {
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
            callback(null, {
                statusCode: 400,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({errors: [{message: "Order is already closed"}]}),
            });

            return;
        }

        const updateParams = {
            TableName: process.env.ORDER_TABLE,
            Key: {
                id: id,
            },
            ExpressionAttributeNames: {
                '#order_client': 'client',
                '#order_total': 'total',
                '#order_items': 'items',
            },
            ExpressionAttributeValues: {
                ':client': data.client,
                ':total': data.total,
                ':items': data.items.map((element) => {
                    element.id = element.id || new uuid.v1();
                    return element;
                })
            },
            UpdateExpression: 'SET #order_client = :client, #order_total = :total, #order_items = :items',
            ReturnValues: 'ALL_NEW',
        };

        dynamoDb.update(updateParams, (error) => {
            if (error) {
                console.error(error);
                callback(null, {
                    statusCode: error.statusCode || 501,
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({errors: [{message: 'Order cannot be updated. Internal server error'}]}),
                });

                return;
            }

            dynamoDb.get(fetchParams, (error, result) => {

                const item = result.Item;
                let order = new hal.Resource({
                    id: item.id,
                    status: item.status || 'closed',
                    client: item.client,
                    total: parseFloat(item.total),
                    currency: 'EUR',
                    items: item.items.map((arr) => {
                        arr['price'] = parseFloat(arr['price']);
                        return arr;
                    })
                }, baseUrl + '/orders/' + id);

                order.link('list', baseUrl + '/orders');

                const response = {
                    statusCode: 200,
                    headers: {'Content-Type': 'text/plain'},
                    body: JSON.stringify(order.toJSON()),
                };

                callback(null, response);
            });
        });
    });
};

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const hal = require('hal');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: process.env.ORDER_TABLE,
    Limit: (process.env.ITEMS_NUMBER_LIMIT || 20)
};

module.exports.list = (event, context, callback) => {
    const baseUrl = process.env.BASE_API_URL || 'https://' + event.headers.Host + '/' + event.requestContext.stage;
    const ordersCollection = new hal.Resource({
        currentlyProcessing: 14,
        shippedToday: 20
    }, baseUrl + '/orders');

    if (event.queryStringParameters && event.queryStringParameters.startItem) {
        params.ExclusiveStartKey = { id: event.queryStringParameters.startItem };
    }

    dynamoDb.scan(params, (error, result) => {
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: { 'Content-Type': 'text/plain' },
                body: 'Couldn\'t fetch the orders.',
            });
            return;
        }

        if (result.LastEvaluatedKey) {
            ordersCollection.link('next', baseUrl + '/orders?startItem=' + result.LastEvaluatedKey.id);
        }

        let orders = [];
        for (let i = 0; i < result.Items.length; i++) {
            let item = result.Items[i];
            let orderLink = baseUrl + '/orders/' + item.id;
            let resource = new hal.Resource({
                id: item.id,
                status: item.status || 'closed',
                client: item.client,
                total: item.total,
                currency: 'EUR'
            }, orderLink);
            orders.push(resource);
        }

        ordersCollection.embed('orders', orders);

        const response = {
            statusCode: 200,
            headers: {'Content-Type': 'application/hal+json'},
            body: JSON.stringify(ordersCollection.toJSON()),
        };
        callback(null, response);
    });
};

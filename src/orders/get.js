const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const hal = require('hal');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: process.env.ORDER_TABLE,
};

module.exports.get = (event, context, callback) => {
    const baseUrl = process.env.BASE_API_URL || 'https://' + event.headers.Host + '/' + event.requestContext.stage;
    const id = event.pathParameters.id;
    params.Key = {id: id};

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
                body: 'Order id "'+id+'" has not been found',
            });

            return;
        }

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
            headers: {'Content-Type': 'application/hal+json'},
            body: JSON.stringify(order.toJSON()),
        };
        callback(null, response);
    });
};

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const Validator = require('./validator');
const hal = require('hal');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
    const baseUrl = process.env.BASE_API_URL || 'https://' + event.headers.Host + '/' + event.requestContext.stage;
    const id = uuid.v1();
    const data = JSON.parse(event.body);
    const errors = Validator.validate(data);

    console.log(data);

    if (errors && errors.length) {
        console.error('Validation Failed', errors);
        callback(null, {
            statusCode: 400,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({errors: errors}),
        });

        return;
    }

    const params = {
        TableName: process.env.ORDER_TABLE,
        Item: {
            id: id,
            status: 'open',
            client: data.client,
            total: data.total,
            items: data.items.map((element) => {
                element.id = uuid.v1();
                return element;
            })
        },
    };

    dynamoDb.put(params, (error) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({errors: [{message: 'Order cannot be created. Internal server error'}]}),
            });

            return;
        }

        let order = new hal.Resource(params.Item, baseUrl + '/orders/' + id);
        order.link('list', baseUrl + '/orders');

        const response = {
            statusCode: 201,
            headers: {'Content-Type': 'application/hal+json'},
            body: JSON.stringify(order),
        };

        callback(null, response);
    });

};

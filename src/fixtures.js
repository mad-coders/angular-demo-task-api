const mocker = require('mocker-data-generator').default;
const uuid = require('uuid');
const util = require('util');
const path = require('path');
const fs = require('fs');

const itemNum = process.env.FIXTURES_ITEMS_NUM || 1200;
const orderNum = process.env.FIXTURES_ORDERS_NUM || 6000;
const stage = process.env.FIXTURES_STAGE || 'prod';

const fileName = ['orders-', stage, '.json'].join('');
const filePath = path.join(__dirname, '..', 'fixtures', 'generated', fileName);

const order = {
    id: {
        function: () => {
            return (uuid.v1());
        }
    },
    client: {
        faker: 'company.companyName'
    },
    items: [
        {
            function: function()  {
                return this.faker.random.arrayElement(this.db.items)
            },
            eval: true,
            length: 3,
            min: 1,
            fixedLength: false
        }],
    total: {
        function: function()  {
            let sum = 0.0;
            for (let i = 0; i < this.object.items.length; i++) {
                const item = this.object.items[i];
                sum = sum + parseFloat(item.price).toFixed(2);
            }

            return parseFloat(sum).toFixed(2);
        }
    }
};

const item = {
    id: {
        function: function() {
            return (uuid.v1());
        }
    },
    itemName: {
        faker: 'commerce.productName'
    },
    price: {
        function: function() {
            return parseFloat(this.faker.commerce.price()).toFixed(2);
        }
    },
    color: {
        faker: 'commerce.color'
    }
};

const saveItems = (items) => {
    const json = JSON.stringify(items);

    fs.writeFile(filePath, json, function (err) {
        if (err) {
            return console.log(err);
        }

        console.log('Order has been saved to ' + filePath + ' was saved!');
    });
};

const createMocks = function() {
    mocker()
        .schema('items', item, itemNum)
        .schema('orders', order, orderNum)
        .build()
        .then(
            data => {
                console.log(util.inspect(data.orders, {depth: 3}));
                console.log('Prepare to save...');

                saveItems(data.orders);
            },
            err => console.error(err)
        );
};

createMocks();

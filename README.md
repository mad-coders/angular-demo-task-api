# Test task
## Create CRUD for given API endpoint 
Endpoint: https://pyjqrozqt9.execute-api.eu-central-1.amazonaws.com/prod/orders
Supported views and actions:
- list all orders (table/grid)
- edit order 
- create order (with order items) 
- delete ordert
- add breadcrumbs

## Use following 
- only orders which has status different than "closed" can be deleted or updated
- remember about correct error handling
- keep performance aspects in mind

## API doc:
 | METHOD|      PATH      |  Description |
 |----------|:-------------:|------:|
| GET | /prod/orders | displays order list |
| POST  | /prod/orders | order create order. Requires "order payload" |
| GET | /prod/orders/{id} | order details |
| DELETE | /prod/orders/{id} | delete order |  
| PUT /prod/orders/{id} | updates order. Requires "order payload"  |  

**Order payload:**
```
{
    "status": "open",
    "client": "Strosin LLC XXXXX",
    "total": 922,
    "items": [
        {
            "itemName": "Handmade Metal Table",
            "color": "mint green",
            "price": 922
        }
    ]
}
```

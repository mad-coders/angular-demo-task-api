const validateItems = (items, errors) => {
    const requiredFields = [ 'price', 'itemName', 'color' ];

    for(let itemKey = 0; itemKey < items.length; itemKey++) {
        let item = items[itemKey];
        for (let i = 0; i < requiredFields.length; i++) {
            let field = requiredFields[i];
            if (!item[field]) {
                errors.push({message: 'field "item.' + field + '" is required'});
            }
        }
    }

    return errors;
};

const validate = (data) => {
    let errors = [];
    const requiredFields = [ 'total', 'client' ];

    if (!data) {
        errors.push({ message: 'Post body must be valid json' });
    }

    if (!data.items || !data.items.length) {
        errors.push({ message: 'at least one order item is requierd' });
    } else {
        validateItems(data.items, errors);
    }

    for(let i = 0; i < requiredFields.length; i++) {
        let field = requiredFields[i];
        if (!data[field]) {
            errors.push({ message: 'field "'+field+'" is required' });
        }
    }

    return errors;
};

module.exports.validate = validate;

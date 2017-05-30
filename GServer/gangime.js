'use strict';

const resSucc = (res, data) => {
    let resultModel = {
        msg : 'success',
        data : data ? data : null
    };
    res.status(200);
    res.json(resultModel);
};

module.exports = resSucc;
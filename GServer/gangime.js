const resSucc = (res, data) => {
    let resultModel = {
        msg: 'success'
    };
    if (Array.isArray(data)) {
        resultModel.total = data.length;
        // const idxName = Object.keys(data[0])[0];
        const idxName = Object.keys(data[0].dataValues)[0];
        resultModel.index = {
            start: data[0][idxName],
            end: data[data.length - 1][idxName]
        }
    }
    resultModel.data = data ? data : null;
    res.status(200);
    res.json(resultModel);
};

module.exports = resSucc;
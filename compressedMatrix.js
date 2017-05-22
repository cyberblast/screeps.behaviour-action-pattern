// Wrapper class for PathFinder.CostMatrix to define our own compression
const CompressedMatrix = {};
module.exports = CompressedMatrix;
CompressedMatrix.serialize = function(costMatrix) {
    let ret = `${costMatrix._bits[0]}x`;
    let count = 1;
    for (let i = 1; i < costMatrix._bits.length; i++) {
        let curr = costMatrix._bits[i];
        if (curr !== costMatrix._bits[i - 1]) {
            ret += `${count},${curr}x`;
            count = 1;
        } else {
            count++;
        }
    }
    ret += `${count}`;
    return ret;
};
CompressedMatrix.deserialize = function(data) {
    const matrix = new PathFinder.CostMatrix();
    const entries = data.split(',');
    let total = 0;
    let len = entries.length;
    let entry, cost, count;
    entries.forEach(e => {
        entry = e.split('x');
        cost = entry[0];
        count = entry[1];
        if (cost) {
            _.times(count, (i) => {
                matrix._bits[total] = cost;
                total++;
            });
        } else {
            total += count;
        }
    });
    return matrix;
};
CompressedMatrix.compareEfficiency = function(count, costMatrix = new PathFinder.CostMatrix(), verbose=true) {
    const threshold = verbose ? 0 : 5; // don't display for each unless verbose
    let serialized, stringified, normalStringified, compressedStringified;
    const p = Util.startProfiling();
    const total = Util.startProfiling();
    for (var i = 0; i < count; i++) {
        serialized = costMatrix.serialize();
        if (verbose) console.log('normal', serialized);
        p.checkCPU('normal-serialize', threshold, 'normal-serialize');
        stringified = JSON.stringify(serialized);
        normalStringified = stringified;
        if (verbose) console.log('normal-deserialize', PathFinder.CostMatrix.deserialize(JSON.parse(stringified)).serialize());
        p.checkCPU('normal-deserialize', threshold, 'normal-deserialize');
        total.checkCPU('normal-total', threshold, 'normal-total');
        serialized = CompressedMatrix.serialize(costMatrix);
        if (verbose) console.log('comp-serialize', serialized);
        p.checkCPU('comp-serialize', threshold, 'comp-serialize');
        stringified = JSON.stringify(serialized);
        compressedStringified = stringified;
        if (verbose) console.log('comp-deserialize', CompressedMatrix.deserialize(JSON.parse(stringified)).serialize());
        p.checkCPU('comp-deserialize', threshold, 'comp-deserialize');
        total.checkCPU('comp-total', threshold, 'comp-total');
    }
    nSize = normalStringified.length / 1024;
    cSize = compressedStringified.length / 1024;
    console.log('normal size:', _.round(nSize, 2),
                'compressed size:', _.round(cSize, 2),
                'reduction(% of original size):', _.round(cSize / nSize, 2));
};

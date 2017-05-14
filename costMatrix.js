// Wrapper class for PathFinder.CostMatrix to define our own compression
const CostMatrix = class {
    constructor(costMatrix = new PathFinder.CostMatrix()) {
        this._costMatrix = costMatrix;
    }
    clone() {
        return new CostMatrix(this._costMatrix.clone());
    }
    set(x, y, cost) {
        this._costMatrix.set(x, y, cost);
    }
    get(x, y) {
        return this._costMatrix.get(x, y);
    }
    serialize() {
        const serialize = arr => arr
            .reduce((m, e, i) => {
                if (e !== arr[i - 1]) {
                    m.push({count: 1, e});
                } else {
                    m[m.length - 1].count++;
                }
                return m;
            }, [])
            .map(({count, e}) => count > 1 ? `${e}x${count}` : e)
            .join(',');
        return serialize(this._costMatrix.serialize());
    }
    static deserialize(data) {
        const parse = serialized => {
            serialized = Array.isArray(serialized) ? serialized.toString() : serialized; // support for old cached values
            const arr = serialized.replace(/(\d+)x(\d+),?/g, (z, p1, p2) => _.repeat(p1 + ',', +p2)).split(',');
            arr.pop();
            return arr.map(s => +s);
        };
        
        return PathFinder.CostMatrix.deserialize(parse(data));
    }
};
module.exports = CostMatrix;
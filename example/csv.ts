import * as p from '../parser';

function charRange(from: string, to: string): string[] {
    let f = from.charCodeAt(0);
    let t = to.charCodeAt(0);

    let ret = []
    for (let i = f; i <= t; i++) {
        ret.push(String.fromCharCode(i));
    }

    return ret;
}

let matchAnyChar = p.anyOf(...charRange("a","z").concat(charRange("A","Z")));
let matchAnyString = p.map(p.many1(matchAnyChar), (x) => x.join(''));

let digit = p.anyOf(...charRange("0","9"));
let matchNumber = p.map(p.many1(digit), (x) => Number(x.join('')));

// TODO consider making this a parser in standard library
function sepBy<T>(par: p.Parser<T>, c: string): p.Parser<T[]>  {
    let sep = p.parseChar(c);
    return p.many1(p.choice(p.matchFirst(par, sep), par));
    // warning using p.many here leads to infinite loop
}

let matchHeader = sepBy(matchAnyString, ",");
let matchRow = sepBy(matchNumber, ",");
let matchColumns = sepBy(matchRow, "\n");

let csvP = p.andThen(
    p.matchFirst(matchHeader, p.parseChar("\n")),
    matchColumns);


function getData(data: string) {
    let res = csvP(data);
    if (res instanceof p.ParseResult) {
        let val = res.value;
        let header = val[0];
        let d = val[1];
        console.log("header: " + header.toString());
        console.log("data:");
        for (let e of d) {
            console.log(e);
        }
    }
}

// gibberish data
let test = 
"pressure,density,amount\n123,456,2113\n23,1234,4754\n345,5457,234\n2346,4573,24637\n23526,46346,235";
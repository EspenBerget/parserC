
export class ParseError {
   msg : string;
   funName : string;
   constructor(msg: string, funName: string) {
       this.msg = "Error: " + msg;
       this.funName = funName;
   } 
} 

export class ParseResult<T> {
    value: T;
    rest: string;
    constructor(value: T, rest: string) {
        this.value = value;
        this.rest = rest;
    }
}

type Result<T> = ParseResult<T> | ParseError;
type Parser<T> = (s: string) => Result<T>;

// TODO: will fail if c is more than one char long
export function parseChar(c: string): Parser<string> {
    if (c.length !== 1)
        throw new Error(`Length of string to match must be 1. Got "${c}".`);
    return (s: string) => {
        let first = s.charAt(0);
        if (c === first)
            return new ParseResult(first, s.substr(1));
        return new ParseError(`Expected "${c}" got "${first}"`, "parseChar");
    }
}

// Combine parsers in sequence.
export function andThen<T,U>(p1: Parser<T>, p2: Parser<U>): Parser<[T,U]> {
    return (s: string) => {
        let res1 = p1(s);
        if (res1 instanceof ParseError)
            return res1;
        let res2 = p2(res1.rest);
        if (res2 instanceof ParseError)
            return res2;
        return new ParseResult([res1.value, res2.value], res2.rest);
    }
}

// Combine parsers in sequence, but only keep first result
export function matchFirst<T,U>(p1: Parser<T>, p2: Parser<U>): Parser<T> {
    let p = andThen(p1, p2);
    return map(p, ([x,y]) => x);
}

// Combine parsers in sequence, but only keep second result
export function matchSecond<T,U>(p1: Parser<T>, p2: Parser<U>): Parser<U> {
    let p = andThen(p1, p2);
    return map(p, ([x,y]) => y);
}

// match only result between two parsers
export function between<T,U,V>(p1: Parser<T>, p2: Parser<U>, p3: Parser<V>): Parser<U> {
    return matchSecond(p1, matchFirst(p2, p3));
}

// Try one parser, if it fails try the other
export function orElse<T,U>(p1: Parser<T>, p2: Parser<U>): Parser<T | U> {
    return (s: string) => {
        let res = p1(s);
        if (res instanceof ParseError) 
            return p2(s);
        return res;
    }
}

// Try a series of parser
export function choice<T>(...pArr: Parser<T>[]): Parser<T> {
    if (pArr.length < 2) {
        throw new Error("choice takes 2 or more arguments");
    }
    return pArr.reduce(orElse);
}

// Try a series of characters
export function anyOf(...pArr: string[]): Parser<string> {
    return choice(...pArr.map(parseChar));
}

// map a function to a result
export function map<T,U>(p1: Parser<T>, f: (t: T) => U): Parser<U> {
    return (s: string) => {
        let res = p1(s);
        if (res instanceof ParseError)
            return res;
        return new ParseResult(f(res.value), res.rest);
    }
}

// Ignores input and always returns value t
export function returnP<T>(t: T): Parser<T> {
    return (s: string) => {
        return new ParseResult(t, s);
    }
}

// Apply a parser with a function value to another parser
export function apply<T,U>(pF: Parser<(t: T) => U>, pT: Parser<T>): Parser<U> {
    return map(andThen(pF, pT), ([f,t]) => f(t));
}

// lift a 2 argument function to parser world
export function lift2<T,U,V>(f: (t: T) => (u: U) => V): (pT: Parser<T>, pU: Parser<U>) => Parser<V> {
    let pTU = returnP(f);
    return (pT, pU) => {
        return apply(apply(pTU, pT), pU);
    }
}

// helpers for sequence
function cons<T>(h: T) {
    return (t: T[]) => [h, ...t]; // curry the function
}
let consP = lift2(cons);

// Match a series of parsers
export function sequence<T>(...pArr: Parser<T>[]): Parser<T[]> {
    if (pArr.length === 0) {
        return returnP([]);
    } else {
        let [h, ...t] = pArr;
        return consP(h, sequence(...t));
    }
}

// Match a string of characters
export function stringP(s: string): Parser<string> {
    let pS = s.split('').map(c => parseChar(c));
    let pSS = sequence(...pS);
    return map(pSS, (x) => x.join(''));
}

// Helper function for many, and many1. parses a string into a list of values 
function parseMany<T>(p: Parser<T>, s: string): [T[], string] {
    let res = p(s);
    let ret = [];
    while (res instanceof ParseResult) {
        ret.push(res.value);
        s = res.rest;
        res = p(s);
    }
    return [ret, s];
}

// Match a parser zero or more times
export function many<T>(p: Parser<T>): Parser<T[]> {
    return (s: string) => {
        let [res, next_s] = parseMany(p, s);
        return new ParseResult(res, next_s);
    }
}

// Match a parser one or more times
export function many1<T>(p: Parser<T>): Parser<T[]> {
    return (s: string) => {
        let [res, next_s] = parseMany(p, s);
        if (res.length === 0)
            return new ParseError("needs at least one match", "many1");
        else
            return new ParseResult(res, next_s);
    }
}

// either match a parser or return null
export function optional<T>(p: Parser<T>): Parser<T | null> {
    return (s: string) => {
        let res = p(s);
        if (res instanceof ParseError)
            return new ParseResult(null, s);
        return res;
    }
}

// bind a parser with a function that returns a parser
export function bind<T,U>(p: Parser<T>, f: (t: T) => Parser<U>): Parser<U> {
    return (s: string) => {
        let res = p(s);
        if (res instanceof ParseError)
            return res;
        let p2 = f(res.value);
        return p2(res.rest);
    }
}

// Run a parser
export function run<T>(p: Parser<T>, s: string): T | void {
    let res = p(s);
    if (res instanceof ParseError)
        console.log(res.funName + "!\n" + res.msg);
    if (res instanceof ParseResult)
        return res.value;
}
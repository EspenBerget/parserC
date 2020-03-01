
export class ParseError {
   msg : string;
   funName : string;
   constructor(msg: string, funName: string) {
       this.msg = "Error: " + msg;
       this.funName = funName;
   } 
} // only a string for now. will be an error-context later

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

// Try one parser, if it fails try the other
export function orElse<T,U>(p1: Parser<T>, p2: Parser<U>): Parser<T | U> {
    return (s: string) => {
        let res = p1(s);
        if (res instanceof ParseError) 
            return p2(s);
        return res;
    }
}

// Apply a function to a result
export function apply<T,U>(p1: Parser<T>, f: (t: T) => U): Parser<U> {
    return (s: string) => {
        let res = p1(s);
        if (res instanceof ParseError)
            return res;
        return new ParseResult(f(res.value), res.rest);
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
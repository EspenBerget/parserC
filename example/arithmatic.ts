import * as p from '../parser';

// 1. Make a structure to parse to
interface Op {
    kind: '*' | '+' | '-' | '/';
    x: Eval;
    y: Eval;
}
function newOp(kind: any): Op {
    return { 
        kind: kind,
        x: new Num(0),
        y: new Num(0)
    }
}
class Num {
    x: number
    constructor(x: number) {
        this.x = x;
    }
}
type Eval = Op | Num;

function evalArith(e: Eval): number {
    if (e instanceof Num)
        return e.x;
    
    let x = evalArith(e.x);
    let y = evalArith(e.y);
    switch(e.kind) {
        case '+':
            return x+y;
        case '*':
            return x*y;
        case '/':
            return x/y;
        case '-':
            return x-y;
    }
}
// 2. Make a parser built like the structure

// parse a digit
let digit = p.map(
    p.many1(p.anyOf('1','2','3','4','5','6','7','8','9','0')),
    (x: string[]) => new Num(Number(x.join(''))) as Eval
);
let whitespace = p.many(p.anyOf(' ', '\t'));
let op = p.map(p.anyOf('+','-','/','*'), (kind) => { return (newOp(kind) as Eval)});

// TODO.
// TypeScript wont allow recursive dependencies, this limits my design... 
// Original plan was to have a arith parser e.g:
// let arith = orElse(digit, expr)
// then replace digit with arith in the following expression.
let expr = 
    p.map(p.sequence(
        p.matchSecond(p.parseChar('('), digit),
        p.between(whitespace, op, whitespace),
        p.matchFirst(digit, p.parseChar(')'))),
        (([x,op,y]) => {
            (op as Op).x = x; 
            (op as Op).y = y; 
            return op as Eval
        })
);



function parseAndRunArith(s: string): number | void {
    let op = expr(s);
    if (op instanceof p.ParseError) {
        console.log(op.msg);
    } else if (op instanceof p.ParseResult)
    return evalArith(op.value);
}
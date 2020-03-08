
import * as p from '../parser';

// whitespace
let whitespace = p.many(p.anyOf(' ', '\t'));

// curried functions
let add = (x:number) => (y:number) => x+y;
let sub = (x:number) => (y:number) => x-y;
let mul = (x:number) => (y:number) => x*y;
let div = (x:number) => (y:number) => x/y;

// op parser functions
let addP = p.lift2(add);
let subP = p.lift2(sub);
let mulP = p.lift2(mul);
let divP = p.lift2(div);

// op parser match
let matchAdd = p.between(whitespace, p.parseChar('+'), whitespace);
let matchSub = p.between(whitespace, p.parseChar('-'), whitespace);
let matchMul = p.between(whitespace, p.parseChar('*'), whitespace);
let matchDiv = p.between(whitespace, p.parseChar('/'), whitespace);

// number parse functions
let digit = p.anyOf('1','2','3','4','5','6','7','8','9','0');
let numberP = p.map(p.many1(digit), (x) => Number(x.join('')));

// match expressions
// TODO should use expr in place of numberP, currently not possible in TS.
let exprAdd = addP(p.matchFirst(numberP, matchAdd), numberP);
let exprSub = subP(p.matchFirst(numberP, matchSub), numberP);
let exprMul = mulP(p.matchFirst(numberP, matchMul), numberP);
let exprDiv = divP(p.matchFirst(numberP, matchDiv), numberP);

let expr = p.choice(exprAdd, exprSub, exprMul, exprDiv, numberP);

/* this matches:
   <number>
   <number> + <number>
   <number> - <number>
   <number> * <number>
   <number> / <number>

   example: 
    expr("123 + 456");
    expr("123");
    expr("123 * 45");
*/

// alternative expr. PEMDAS not respected!
let mapAdd = p.matchFirst(p.matchSecond(whitespace, p.map(numberP, add)), p.andThen(whitespace, p.parseChar('+')));
let mapSub = p.matchFirst(p.matchSecond(whitespace, p.map(numberP, sub)), p.andThen(whitespace, p.parseChar('-')));
let mapMul = p.matchFirst(p.matchSecond(whitespace, p.map(numberP, mul)), p.andThen(whitespace, p.parseChar('*')));
let mapDiv = p.matchFirst(p.matchSecond(whitespace, p.map(numberP, div)), p.andThen(whitespace, p.parseChar('/')));

let opP = p.choice(mapAdd,mapSub,mapMul,mapDiv);
let expr_alt = p.map(
    p.andThen(p.many(opP), p.matchSecond(whitespace, numberP)),
    (x) => {
        let [fs, y] = x;
        while (fs.length !== 0) {
            let f = fs.pop();
            if (f !== undefined)
                y = f(y);
        }
        return y;
    }
);
    
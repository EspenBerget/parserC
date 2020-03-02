import * as p from './parser'; 
import { expect } from 'chai';

describe("Make a parser with parseChar", () => {
    it("should make a parser on single-character input", () => {
        let pA = p.parseChar("A");
        expect(pA).to.be.a('function');
    });
    it("should throw error on multi-character input", () => {
        let f = () => p.parseChar("BC");
        expect(f).to.throw(
            'Length of string to match must be 1. Got "BC".'
        );
    });
});

describe("Parse a character, using parseChar", () => {
    let pA = p.parseChar('A');
    it("should parse the character 'A'", () => {
        let res = p.run(pA, "ABC");
        expect(res).to.equal('A');
    });
    it("should fail on empty input", () => {
        expect(pA("")).to.be.an.instanceOf(p.ParseError);
    });
    it("should fail on wrong input", () => {
        expect(pA("B")).to.be.an.instanceOf(p.ParseError);
    });
});

describe("Parsers should combine in sequence, using andThen", () => {
    let pA = p.parseChar('A');
    let pB = p.parseChar('B');
    let pAB = p.andThen(pA, pB);
    it("should succeed if given a string with infix 'AB'", () => {
        expect(pAB("ABC")).to.be.an.instanceOf(p.ParseResult);
    });
    it("should fail if first parser fails", () => {
        expect(pAB("BBC")).to.be.an.instanceOf(p.ParseError);
    });
    it("should fail if second parser fails", () => {
        expect(pAB("ACC")).to.be.an.instanceOf(p.ParseError);
    });
    it("should fail on empty input", () => {
        expect(pAB("")).to.be.an.instanceOf(p.ParseError);
    });
});

describe("Parsers should combine in disjunction, using orElse", () => {
    let pA = p.parseChar("A");
    let pB = p.parseChar("B");
    let pAorB = p.orElse(pA, pB);
    it("should succeed if infix is 'A'", () => {
        expect(pAorB("ABC")).to.be.an.instanceOf(p.ParseResult);
    });
    it("should succeed if infix is 'B'", () => {
        expect(pAorB("BBC")).to.be.an.instanceOf(p.ParseResult);
    });
    it("should fail if infix is neighter 'A' or 'B'", () => {
        expect(pAorB("CCC")).to.be.an.instanceOf(p.ParseError);
    });
    it("should fail on empty input", () => {
        expect(pAorB("")).to.be.an.instanceOf(p.ParseError);
    });
})

describe("Map a function to a ParserResults value", () => {
    let pNum = p.parseChar("1");
    let pToNum = p.map(pNum, Number);
    it("should fail on empty input", () => {
        expect(pToNum("")).to.be.an.instanceOf(p.ParseError);
    });
    it("should fail on wrong input, but right input type", () => {
        expect(pToNum("2")).to.be.an.instanceOf(p.ParseError);
    });
    it("should succeed on infix '1'", () => {
        expect(p.run(pToNum, "1")).to.equal(1);
    });
});

describe("choice should match any of a series of parsers", () => {
    it("should fail if given zero arguments", () => {
        expect(() => p.choice()).to.throw();
    });
    it("should fail if given one argument", () => {
        expect(() => p.choice(p.parseChar("A"))).to.throw();
    });
    it("should succeed on multiple arguments", () => {
        let pA = p.parseChar("A");
        let pB = p.parseChar("B");
        let pC = p.parseChar("C");
        let orAB = p.choice(pA,pB);
        let orABC = p.choice(pA,pB,pC);
        expect(orAB("ABC")).to.be.an.instanceOf(p.ParseResult);
        expect(orABC("DBC")).to.be.an.instanceOf(p.ParseError);
    });
});

describe("anyOf should match any of a series of characters", () => {
    it("should fail if given zero arguments", () => {
        expect(() => p.anyOf()).to.throw();
    });
    it("should fail if given one argument", () => {
        expect(() => p.anyOf("A")).to.throw();
    });
    it("should succeed on multiple arguments", () => {
        let pAorB = p.anyOf("A", "B", "C");
        expect(pAorB("A")).to.be.an.instanceOf(p.ParseResult);
    });
});
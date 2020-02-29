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

describe("Parse a character", () => {
    let pA = p.parseChar('A');
    it("should parse the character 'A'", () => {
        let res = p.run(pA, "ABC");
        expect(res).to.equal('A');
    });
    it("should fail on empty input", () => {
        let res = pA("");
        expect(res).to.be.an.instanceOf(p.ParseError);
    });
    it("should fail on wrong input", () => {
        let res = pA("B");
        expect(res).to.be.an.instanceOf(p.ParseError);
    });
});

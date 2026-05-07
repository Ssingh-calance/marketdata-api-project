const is = require('@barchart/common-js/lang/is'),
  string = require('@barchart/common-js/lang/string');
const AssetClass = require('./../data/AssetClass');

module.exports = (() => {
  'use strict';

  class SymbolParser {
    constructor() {}

    static getIsConcrete(symbol) {
      return is.string(symbol) && !this.getIsReference(symbol);
    }

    static getIsReference(symbol) {
      return is.string(symbol) && types.futures.alias.test(symbol);
    }

    static getIsFuture(symbol) {
      return is.string(symbol) && (types.futures.concrete.test(symbol) || types.futures.alias.test(symbol));
    }

    static getIsCash(symbol) {
      return SymbolParser.getIsFuture(symbol) && types.futures.cash.test(symbol);
    }

    static getIsFutureSpread(symbol) {
      return is.string(symbol) && types.futures.spread.test(symbol);
    }

    static getIsFutureOption(symbol) {
      return is.string(symbol) && (types.futures.options.short.test(symbol) || types.futures.options.long.test(symbol) || types.futures.options.historical.test(symbol));
    }

    static getIsForex(symbol) {
      return is.string(symbol) && types.forex.test(symbol);
    }

    static getIsCrypto(symbol) {
      return is.string(symbol) && types.crypto.test(symbol);
    }

    static getIsIndex(symbol) {
      return is.string(symbol) && types.indicies.external.test(symbol);
    }

    static getIsSector(symbol) {
      return is.string(symbol) && types.indicies.sector.test(symbol);
    }

    static getIsCanadianFund(symbol) {
      return is.string(symbol) && types.funds.canadian.test(symbol);
    }

    static getIsCmdty(symbol) {
      return is.string(symbol) && (types.cmdty.stats.test(symbol) || types.cmdty.internal.test(symbol) || types.cmdty.external.test(symbol));
    }

    static getIsCmdtyStats(symbol) {
      return is.string(symbol) && types.cmdty.stats.test(symbol);
    }

    static getIsBats(symbol) {
      return is.string(symbol) && predicates.bats.test(symbol);
    }

    static getIsEquityOption(symbol) {
      return is.string(symbol) && types.equities.options.test(symbol);
    }

    static getIsExpired(symbol) {
      const definition = SymbolParser.parseInstrumentType(symbol);
      let returnVal = false;
      if (definition !== null && definition.year && definition.month) {
        const currentYear = getCurrentYear();
        if (definition.year < currentYear) {
          returnVal = true;
        } else if (definition.year === currentYear && Object.prototype.hasOwnProperty.call(futuresMonthNumbers, definition.month)) {
          const currentMonth = getCurrentMonth();
          const futuresMonth = futuresMonthNumbers[definition.month];
          if (currentMonth > futuresMonth) {
            returnVal = true;
          }
        }
      }
      return returnVal;
    }

    static getIsC3(symbol) {
      return is.string(symbol) && (types.c3.concrete.test(symbol) || types.c3.alias.test(symbol));
    }

    static getIsPlatts(symbol) {
      return is.string(symbol) && (types.platts.concrete.test(symbol) || types.platts.alias.test(symbol));
    }

    static getIsPit(symbol, name) {
      return is.string(symbol) && is.string(name) && predicates.pit.test(name);
    }

    static getIsGrainBid(symbol) {
      return is.string(symbol) && types.bids.test(symbol);
    }

    static parseInstrumentType(symbol) {
      if (!is.string(symbol)) {
        return null;
      }
      let definition = null;
      for (let i = 0; i < parsers.length && definition === null; i++) {
        const parser = parsers[i];
        definition = parser(symbol);
      }
      return definition;
    }

    static getProducerSymbol(symbol) {
      if (!is.string(symbol)) {
        return null;
      }
      let converted = null;
      for (let i = 0; i < converters.length && converted === null; i++) {
        const converter = converters[i];
        converted = converter(symbol);
      }
      return converted;
    }

    static getFuturesOptionPipelineFormat(symbol) {
      const definition = SymbolParser.parseInstrumentType(symbol);
      let formatted = null;
      if (definition && definition.type === 'future_option') {
        const putCallCharacter = getPutCallCharacter(definition.option_type);
        formatted = `${definition.root}${definition.month}${getYearDigits(definition.year, 1)}|${definition.strike}${putCallCharacter}`;
      }
      return formatted;
    }

    static getFuturesExplicitFormat(symbol) {
      let explicit = null;
      if (SymbolParser.getIsFuture(symbol) && SymbolParser.getIsConcrete(symbol)) {
        const parsed = SymbolParser.parseInstrumentType(symbol);
        if (parsed) {
          explicit = `${parsed.root}${parsed.month}${string.padLeft(Math.floor(parsed.year % 100).toString(), 2, '0')}`;
        }
      }
      return explicit;
    }

    static getFuturesYear(yearString, monthCode) {
      return getFuturesYear(yearString, monthCode);
    }

    static displayUsingPercent(symbol) {
      return is.string(symbol) && predicates.percent.test(symbol);
    }

    toString() {
      return '[SymbolParser]';
    }
  }

  const futuresMonthNumbers = { F: 1, G: 2, H: 3, J: 4, K: 5, M: 6, N: 7, Q: 8, U: 9, V: 10, X: 11, Z: 12 };
  const distantFuturesMonths = { F: 'A', G: 'B', H: 'C', J: 'D', K: 'E', M: 'I', N: 'L', Q: 'O', U: 'P', V: 'R', X: 'S', Z: 'T' };
  const alternateFuturesMonths = { A: 'F', B: 'G', C: 'H', D: 'J', E: 'K', I: 'M', L: 'N', O: 'Q', P: 'U', R: 'V', S: 'X', T: 'Z' };

  const predicates = {};
  predicates.bats = /^(.*)\.BZ$/i;
  predicates.percent = /(\.RT)$/;
  predicates.pit = /\(P(it)?\)/;

  const types = {};
  types.bids = /^([A-Z]{2})([B|P])([A-Z\d]{3,4})-(\d+)-(\d+)(\.CM)$/i;
  types.c3 = { alias: /^(C3:)(.*)$/i, concrete: /(\.C3)$/i };
  types.cmdty = { stats: /(\.CS)$/i, internal: /(\.CM)$/i, external: /(\.CP)$/i };
  types.crypto = /^\^([A-Z]{3})([A-Z]{3,4})$/i;
  types.forex = /^\^([A-Z]{3})([A-Z]{3})$/i;
  types.funds = { canadian: /(.*)(\.CF)$/i };
  types.indicies = { external: /^\$(.*)$/i, sector: /^-(.*)$/i };
  types.platts = { alias: /^(PLATTS:)(.*)$/i, concrete: /^(.*)(\.PT)$/i };

  types.futures = {
    spread: /^_S_/i,
    cash: /(.*)(Y00)$/,
    alias: /^([A-Z][A-Z0-9$.!-]{0,2})(\*)([0-9]{1,2})$/i,
    concrete: /^([A-Z][A-Z0-9$.!-]{0,2})([A-Z])([0-9]{4}|[0-9]{1,2})$/i,
    options: {
      historical: /^([A-Z][A-Z0-9$.!-]{0,2})([A-Z])([0-9]{2})([0-9]{1,5})(C|P)$/i,
      long: /^([A-Z][A-Z0-9$.!-]{0,2})([A-Z])([0-9]{1,4})|(-?[0-9]{1,5})(C|P)$/i,
      short: /^([A-Z][A-Z0-9$.!-]?)([A-Z])([0-9]{1,4})([A-Z])$/i
    }
  };

  types.equities = {
    options: /^([A-Z$][A-Z-]{0,}(\.[A-Z])?)([0-9]?)(\.[A-Z]{2})?\|([0-9]{4})([0-9]{2})([0-9]{2})\|([0-9]+\.[0-9]+)[PW]?(C|P)/i
  };

  const parsers = [];
  parsers.push((symbol) => types.futures.spread.test(symbol) ? { symbol, type: 'future_spread' } : null);

  parsers.push((symbol) => {
    const match = symbol.match(types.futures.concrete);
    return match ? { symbol, type: 'future', asset: AssetClass.FUTURE, dynamic: false, root: match[1], month: match[2], year: getFuturesYear(match[3], match[2]) } : null;
  });

  parsers.push((symbol) => {
    const match = symbol.match(types.futures.alias);
    return match ? { symbol, type: 'future', asset: AssetClass.FUTURE, dynamic: true, root: match[1], dynamicCode: match[3] } : null;
  });

  parsers.push((symbol) => {
    const match = symbol.match(types.equities.options);
    if (match) {
      const suffix = match[4] || '';
      return {
        symbol, type: 'equity_option', asset: AssetClass.STOCK_OPTION,
        option_type: match[9] === 'C' ? 'call' : 'put',
        strike: parseFloat(match[8]), root: `${match[1]}${suffix}`,
        month: parseInt(match[6], 10), day: parseInt(match[7], 10), year: parseInt(match[5], 10),
        adjusted: match[3] !== ''
      };
    }
    return null;
  });

  parsers.push((symbol) => {
    const match = symbol.match(types.futures.options.short);
    if (match) {
      const putCallCharacterCode = match[4].charCodeAt(0);
      const isPut = putCallCharacterCode >= 80;
      return {
        symbol, type: 'future_option', asset: AssetClass.FUTURE_OPTION,
        option_type: isPut ? 'put' : 'call',
        strike: parseInt(match[3], 10), root: match[1], month: match[2],
        year: getCurrentYear() + (putCallCharacterCode - (isPut ? 80 : 67))
      };
    }
    return null;
  });

  parsers.push((symbol) => {
    const match = symbol.match(types.futures.options.long) || symbol.match(types.futures.options.historical);
    return match ? {
      symbol, type: 'future_option', asset: AssetClass.FUTURE_OPTION,
      option_type: match[5] === 'C' ? 'call' : 'put',
      strike: parseInt(match[4], 10), root: match[1], month: getFuturesMonth(match[2]), year: getFuturesYear(match[3])
    } : null;
  });

  const converters = [];
  converters.push((symbol) => {
    if (SymbolParser.getIsFuture(symbol) && SymbolParser.getIsConcrete(symbol)) {
      const matches = symbol.match(types.futures.concrete);
      if (matches) {
        const month = matches[2];
        const year = getFuturesYear(matches[3], month);
        if (year > (getCurrentYear() + 9)) {
          const distant = distantFuturesMonths[month];
          if (distant) return `${matches[1]}${distant}${getYearDigits(year, 1)}`;
        }
      }
    }
    return null;
  });

  converters.push((symbol) => {
    if (SymbolParser.getIsFuture(symbol) && SymbolParser.getIsConcrete(symbol)) {
      return symbol.replace(/(.{1,3})([A-Z])([0-9]{3}|[0-9])?([0-9])$/i, '$1$2$4');
    }
    return null;
  });

  converters.push((symbol) => {
    if (SymbolParser.getIsFutureOption(symbol)) {
      const def = SymbolParser.parseInstrumentType(symbol);
      const char = getPutCallCharacter(def.option_type);
      if (def.root.length < 3) {
        return `${def.root}${def.month}${def.strike}${String.fromCharCode(char.charCodeAt(0) + def.year - getCurrentYear())}`;
      }
      return `${def.root}${def.month}${getYearDigits(def.year, 1)}|${def.strike}${char}`;
    }
    return null;
  });

  converters.push((symbol) => symbol);

  function getCurrentMonth() { return new Date().getMonth() + 1; }
  function getCurrentYear() { return new Date().getFullYear(); }
  function getYearDigits(year, digits) {
    const s = year.toString();
    return s.substring(s.length - digits);
  }
  function getFuturesMonth(m) { return alternateFuturesMonths[m] || m; }

  function getFuturesYear(yearString, monthCode) {
    const cur = getCurrentYear();
    let year = parseInt(yearString, 10);
    if (year === 0 && monthCode === 'Y') year = Math.floor(cur / 100) * 100 + 100;
    else if (year < 10 && yearString.length === 1) {
      const bump = (year < cur % 10) ? 1 : 0;
      year = Math.floor(cur / 10) * 10 + year + (bump * 10);
    } else if (year < 100) {
      year = Math.floor(cur / 100) * 100 + year;
      if (cur + 25 < year) year -= 100;
    }
    return year;
  }

  function getPutCallCharacter(type) {
    return type === 'call' ? 'C' : (type === 'put' ? 'P' : null);
  }

  return SymbolParser;
})();
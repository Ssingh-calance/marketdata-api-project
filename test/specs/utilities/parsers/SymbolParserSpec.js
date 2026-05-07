const SymbolParser = require('../../../../lib/utilities/parsers/SymbolParser');

describe('When parsing a symbol for instrument type', () => {
  describe('and the symbol is IBM', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('IBM');
    });

    it('the result should be null', () => {
      expect(instrumentType).toBe(null);
    });
  });

  describe('and the symbol is ESM08', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('ESM08');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "ESM08"', () => {
      expect(instrumentType.symbol).toEqual('ESM08');
    });

    it('the "type" should be "future"', () => {
      expect(instrumentType.type).toEqual('future');
    });

    it('the "dynamic" property should be false', () => {
      expect(instrumentType.dynamic).toEqual(false);
    });

    it('the "root" should be "ES"', () => {
      expect(instrumentType.root).toEqual('ES');
    });

    it('the "month" should be "M"', () => {
      expect(instrumentType.month).toEqual('M');
    });

    it('the "year" should be 2008', () => {
      expect(instrumentType.year).toEqual(2008);
    });
  });

  describe('and the symbol is ESZ9', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('ESZ9');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "ESZ9"', () => {
      expect(instrumentType.symbol).toEqual('ESZ9');
    });

    it('the "type" should be "future"', () => {
      expect(instrumentType.type).toEqual('future');
    });

    it('the "dynamic" property should be false', () => {
      expect(instrumentType.dynamic).toEqual(false);
    });

    it('the "root" should be "ES"', () => {
      expect(instrumentType.root).toEqual('ES');
    });

    it('the "month" should be "Z"', () => {
      expect(instrumentType.month).toEqual('Z');
    });

    it('the "year" should be 2029', () => {
      expect(instrumentType.year).toEqual(2029);
    });
  });

  describe('and the symbol is ESZ16', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('ESZ16');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "ESZ16"', () => {
      expect(instrumentType.symbol).toEqual('ESZ16');
    });

    it('the "type" should be "future"', () => {
      expect(instrumentType.type).toEqual('future');
    });

    it('the "dynamic" property should be false', () => {
      expect(instrumentType.dynamic).toEqual(false);
    });

    it('the "root" should be "ES"', () => {
      expect(instrumentType.root).toEqual('ES');
    });

    it('the "month" should be "Z"', () => {
      expect(instrumentType.month).toEqual('Z');
    });

    it('the "year" should be 2016', () => {
      expect(instrumentType.year).toEqual(2016);
    });
  });

  describe('and the symbol is ESZ2016', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('ESZ2016');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "ESZ2016"', () => {
      expect(instrumentType.symbol).toEqual('ESZ2016');
    });

    it('the "type" should be "future"', () => {
      expect(instrumentType.type).toEqual('future');
    });

    it('the "dynamic" property should be false', () => {
      expect(instrumentType.dynamic).toEqual(false);
    });

    it('the "root" should be "ES"', () => {
      expect(instrumentType.root).toEqual('ES');
    });

    it('the "month" should be "Z"', () => {
      expect(instrumentType.month).toEqual('Z');
    });

    it('the "year" should be 2016', () => {
      expect(instrumentType.year).toEqual(2016);
    });
  });

  describe('and the symbol is SPY00', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('SPY00');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "SPY00"', () => {
      expect(instrumentType.symbol).toEqual('SPY00');
    });

    it('the "type" should be "future"', () => {
      expect(instrumentType.type).toEqual('future');
    });

    it('the "dynamic" property should be false', () => {
      expect(instrumentType.dynamic).toEqual(false);
    });

    it('the "root" should be "SP"', () => {
      expect(instrumentType.root).toEqual('SP');
    });

    it('the "month" should be "Y"', () => {
      expect(instrumentType.month).toEqual('Y');
    });

    it('the "year" should be 2100', () => {
      expect(instrumentType.year).toEqual(2100);
    });
  });

  describe('and the symbol is ES*0', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('ES*0');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "ES*0"', () => {
      expect(instrumentType.symbol).toEqual('ES*0');
    });

    it('the "type" should be "future"', () => {
      expect(instrumentType.type).toEqual('future');
    });

    it('the "dynamic" property should be true', () => {
      expect(instrumentType.dynamic).toEqual(true);
    });

    it('the "root" should be "ES"', () => {
      expect(instrumentType.root).toEqual('ES');
    });

    it('the "dynamicCode" property should be "0"', () => {
      expect(instrumentType.dynamicCode).toEqual('0');
    });
  });

  describe('and the symbol is ES*1', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('ES*1');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "ES*1"', () => {
      expect(instrumentType.symbol).toEqual('ES*1');
    });

    it('the "type" should be "future"', () => {
      expect(instrumentType.type).toEqual('future');
    });

    it('the "dynamic" property should be true', () => {
      expect(instrumentType.dynamic).toEqual(true);
    });

    it('the "root" should be "ES"', () => {
      expect(instrumentType.root).toEqual('ES');
    });

    it('the "dynamicCode" property should be "1"', () => {
      expect(instrumentType.dynamicCode).toEqual('1');
    });
  });

  describe('and the symbol is NG*13', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('NG*13');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "NG*13"', () => {
      expect(instrumentType.symbol).toEqual('NG*13');
    });

    it('the "type" should be "future"', () => {
      expect(instrumentType.type).toEqual('future');
    });

    it('the "dynamic" property should be true', () => {
      expect(instrumentType.dynamic).toEqual(true);
    });

    it('the "root" should be "NG"', () => {
      expect(instrumentType.root).toEqual('NG');
    });

    it('the "dynamicCode" property should be "13"', () => {
      expect(instrumentType.dynamicCode).toEqual('13');
    });
  });

  describe('and the symbol is CLF0', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('CLF0');
    });

    it('the "year" should be 2030', () => {
      expect(instrumentType.year).toEqual(2030);
    });
  });

  describe('and the symbol is CLF1 and the year is 2019', () => {
    let instrumentType;

    beforeEach(() => {
      let getFullYear = Date.prototype.getFullYear;
      Date.prototype.getFullYear = () => { return 2019; };
      instrumentType = SymbolParser.parseInstrumentType('CLF1');
      Date.prototype.getFullYear = getFullYear;
    });

    it('the "year" should be 2021', () => {
      expect(instrumentType.year).toEqual(2021);
    });
  });

  describe('and the symbol is CLF9 and the year is 2019', () => {
    let instrumentType;

    beforeEach(() => {
      let getFullYear = Date.prototype.getFullYear;
      Date.prototype.getFullYear = () => { return 2019; };
      instrumentType = SymbolParser.parseInstrumentType('CLF9');
      Date.prototype.getFullYear = getFullYear;
    });

    it('the "year" should be 2019', () => {
      expect(instrumentType.year).toEqual(2019);
    });
  });

  describe('and the symbol is ^EURUSD', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('^EURUSD');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "^EURUSD"', () => {
      expect(instrumentType.symbol).toEqual('^EURUSD');
    });

    it('the "type" should be "forex"', () => {
      expect(instrumentType.type).toEqual('forex');
    });
  });

  describe('and the symbol is $DOWI', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('$DOWI');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "$DOWI"', () => {
      expect(instrumentType.symbol).toEqual('$DOWI');
    });

    it('the "type" should be "index"', () => {
      expect(instrumentType.type).toEqual('index');
    });
  });

  describe('and the symbol is $SG1E', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('$SG1E');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "$SG1E"', () => {
      expect(instrumentType.symbol).toEqual('$SG1E');
    });

    it('the "type" should be "index"', () => {
      expect(instrumentType.type).toEqual('index');
    });
  });

  describe('and the symbol is -001A', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('-001A');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "-001A"', () => {
      expect(instrumentType.symbol).toEqual('-001A');
    });

    it('the "type" should be "sector"', () => {
      expect(instrumentType.type).toEqual('sector');
    });
  });

  describe('and the symbol is ESZ2660Q', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('ESZ2660Q');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "ESZ2660Q"', () => {
      expect(instrumentType.symbol).toEqual('ESZ2660Q');
    });

    it('the "type" should be "future_option"', () => {
      expect(instrumentType.type).toEqual('future_option');
    });

    it('the "root" should be "ES"', () => {
      expect(instrumentType.root).toEqual('ES');
    });

    it('the "month" should be "Z"', () => {
      expect(instrumentType.month).toEqual('Z');
    });

    it('the "year" should be next year', () => {
      expect(instrumentType.year).toEqual(new Date().getFullYear() + 1);
    });

    it('the "strike" should be 2660', () => {
      expect(instrumentType.strike).toEqual(2660);
    });

    it('the "option_type" should be "put"', () => {
      expect(instrumentType.option_type).toEqual('put');
    });
  });

  describe('and the symbol is ZWH9|470C', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('ZWH9|470C');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "ZWH9|470C"', () => {
      expect(instrumentType.symbol).toEqual('ZWH9|470C');
    });

    it('the "type" should be "future_option"', () => {
      expect(instrumentType.type).toEqual('future_option');
    });

    it('the "root" should be "ZW"', () => {
      expect(instrumentType.root).toEqual('ZW');
    });

    it('the "month" should be "H"', () => {
      expect(instrumentType.month).toEqual('H');
    });

    it('the "year" should be 2029', () => {
      expect(instrumentType.year).toEqual(2029);
    });

    it('the "strike" should be 470', () => {
      expect(instrumentType.strike).toEqual(470);
    });

    it('the "option_type" should be "call"', () => {
      expect(instrumentType.option_type).toEqual('call');
    });
  });

  describe('and the symbol is _S_SP_ZCH7_ZCK7', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('_S_SP_ZCH7_ZCK7');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "_S_SP_ZCH7_ZCK7"', () => {
      expect(instrumentType.symbol).toEqual('_S_SP_ZCH7_ZCK7');
    });

    it('the "type" should be "future_spread"', () => {
      expect(instrumentType.type).toEqual('future_spread');
    });
  });

  describe('and the symbol is AAPL|20200515|250.00P', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('AAPL|20200515|250.00P');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "AAPL|20200515|250.00P"', () => {
      expect(instrumentType.symbol).toEqual('AAPL|20200515|250.00P');
    });

    it('the "type" should be "equity_option"', () => {
      expect(instrumentType.type).toEqual('equity_option');
    });

    it('the "root" should be "AAPL"', () => {
      expect(instrumentType.root).toEqual('AAPL');
    });

    it('the "month" should be 5', () => {
      expect(instrumentType.month).toEqual(5);
    });

    it('the "day" should be 15', () => {
      expect(instrumentType.day).toEqual(15);
    });

    it('the "year" should be 2020', () => {
      expect(instrumentType.year).toEqual(2020);
    });

    it('the "strike" should be 250', () => {
      expect(instrumentType.strike).toEqual(250);
    });

    it('the "option_type" should be "put"', () => {
      expect(instrumentType.option_type).toEqual('put');
    });

    it('the "adjusted" flag should be false', () => {
      expect(instrumentType.adjusted).toEqual(false);
    });
  });

  describe('and the symbol is AAPL1|20200515|250.00P', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('AAPL1|20200515|250.00P');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "AAPL1|20200515|250.00P"', () => {
      expect(instrumentType.symbol).toEqual('AAPL1|20200515|250.00P');
    });

    it('the "type" should be "equity_option"', () => {
      expect(instrumentType.type).toEqual('equity_option');
    });

    it('the "root" should be "AAPL"', () => {
      expect(instrumentType.root).toEqual('AAPL');
    });

    it('the "month" should be 5', () => {
      expect(instrumentType.month).toEqual(5);
    });

    it('the "day" should be 15', () => {
      expect(instrumentType.day).toEqual(15);
    });

    it('the "year" should be 2020', () => {
      expect(instrumentType.year).toEqual(2020);
    });

    it('the "strike" should be 250', () => {
      expect(instrumentType.strike).toEqual(250);
    });

    it('the "option_type" should be "put"', () => {
      expect(instrumentType.option_type).toEqual('put');
    });

    it('the "adjusted" flag should be true', () => {
      expect(instrumentType.adjusted).toEqual(true);
    });
  });

  describe('and the symbol is HBM.TO|20220121|1.00C', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('HBM.TO|20220121|1.00C');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "HBM.TO|20220121|1.00C"', () => {
      expect(instrumentType.symbol).toEqual('HBM.TO|20220121|1.00C');
    });

    it('the "type" should be "equity_option"', () => {
      expect(instrumentType.type).toEqual('equity_option');
    });

    it('the "root" should be "HBM.TO"', () => {
      expect(instrumentType.root).toEqual('HBM.TO');
    });

    it('the "month" should be 1', () => {
      expect(instrumentType.month).toEqual(1);
    });

    it('the "day" should be 21', () => {
      expect(instrumentType.day).toEqual(21);
    });

    it('the "year" should be 2022', () => {
      expect(instrumentType.year).toEqual(2022);
    });

    it('the "strike" should be 1', () => {
      expect(instrumentType.strike).toEqual(1);
    });

    it('the "option_type" should be "call"', () => {
      expect(instrumentType.option_type).toEqual('call');
    });

    it('the "adjusted" flag should be false', () => {
      expect(instrumentType.adjusted).toEqual(false);
    });
  });

  describe('and the symbol is HBM2.TO|20220121|1.00C', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('HBM2.TO|20220121|1.00C');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "HBM2.TO|20220121|1.00C"', () => {
      expect(instrumentType.symbol).toEqual('HBM2.TO|20220121|1.00C');
    });

    it('the "type" should be "equity_option"', () => {
      expect(instrumentType.type).toEqual('equity_option');
    });

    it('the "root" should be "HBM.TO"', () => {
      expect(instrumentType.root).toEqual('HBM.TO');
    });

    it('the "month" should be 1', () => {
      expect(instrumentType.month).toEqual(1);
    });

    it('the "day" should be 21', () => {
      expect(instrumentType.day).toEqual(21);
    });

    it('the "year" should be 2022', () => {
      expect(instrumentType.year).toEqual(2022);
    });

    it('the "strike" should be 1', () => {
      expect(instrumentType.strike).toEqual(1);
    });

    it('the "option_type" should be "call"', () => {
      expect(instrumentType.option_type).toEqual('call');
    });

    it('the "adjusted" flag should be true', () => {
      expect(instrumentType.adjusted).toEqual(true);
    });
  });

  describe('and the symbol is BRK.B|20210205|170.00C', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('BRK.B|20210205|170.00C');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "BRK.B|20210205|170.00C"', () => {
      expect(instrumentType.symbol).toEqual('BRK.B|20210205|170.00C');
    });

    it('the "type" should be "equity_option"', () => {
      expect(instrumentType.type).toEqual('equity_option');
    });

    it('the "root" should be "BRK.B"', () => {
      expect(instrumentType.root).toEqual('BRK.B');
    });

    it('the "month" should be 2', () => {
      expect(instrumentType.month).toEqual(2);
    });

    it('the "day" should be 5', () => {
      expect(instrumentType.day).toEqual(5);
    });

    it('the "year" should be 2021', () => {
      expect(instrumentType.year).toEqual(2021);
    });

    it('the "strike" should be 170', () => {
      expect(instrumentType.strike).toEqual(170);
    });

    it('the "option_type" should be "call"', () => {
      expect(instrumentType.option_type).toEqual('call');
    });

    it('the "adjusted" flag should be false', () => {
      expect(instrumentType.adjusted).toEqual(false);
    });
  });

  describe('and the symbol is BRK.B2|20210205|170.00C', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('BRK.B2|20210205|170.00C');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "BRK.B2|20210205|170.00C"', () => {
      expect(instrumentType.symbol).toEqual('BRK.B2|20210205|170.00C');
    });

    it('the "type" should be "equity_option"', () => {
      expect(instrumentType.type).toEqual('equity_option');
    });

    it('the "root" should be "BRK.B"', () => {
      expect(instrumentType.root).toEqual('BRK.B');
    });

    it('the "month" should be 2', () => {
      expect(instrumentType.month).toEqual(2);
    });

    it('the "day" should be 5', () => {
      expect(instrumentType.day).toEqual(5);
    });

    it('the "year" should be 2021', () => {
      expect(instrumentType.year).toEqual(2021);
    });

    it('the "strike" should be 170', () => {
      expect(instrumentType.strike).toEqual(170);
    });

    it('the "option_type" should be "call"', () => {
      expect(instrumentType.option_type).toEqual('call');
    });

    it('the "adjusted" flag should be true', () => {
      expect(instrumentType.adjusted).toEqual(true);
    });
  });

  describe('and the symbol is $VIX|20200422|20.00WP', () => {
    let instrumentType;

    beforeEach(() => {
      instrumentType = SymbolParser.parseInstrumentType('$VIX|20200422|20.00WP');
    });

    it('the result should not be null', () => {
      expect(instrumentType).not.toBe(null);
    });

    it('the "symbol" should be "$VIX|20200422|20.00WP"', () => {
      expect(instrumentType.symbol).toEqual('$VIX|20200422|20.00WP');
    });

    it('the "type" should be "equity_option"', () => {
      expect(instrumentType.type).toEqual('equity_option');
    });

    it('the "root" should be "$VIX"', () => {
      expect(instrumentType.root).toEqual('$VIX');
    });

    it('the "month" should be 4', () => {
      expect(instrumentType.month).toEqual(4);
    });

    it('the "day" should be 22', () => {
      expect(instrumentType.day).toEqual(22);
    });

    it('the "year" should be 2020', () => {
      expect(instrumentType.year).toEqual(2020);
    });

    it('the "strike" should be 20', () => {
      expect(instrumentType.strike).toEqual(20);
    });

    it('the "option_type" should be "put"', () => {
      expect(instrumentType.option_type).toEqual('put');
    });

    it('the "adjusted" flag should be false', () => {
      expect(instrumentType.adjusted).toEqual(false);
    });
  });
});

describe('When parsing a symbol for a futures contract', () => {
  describe('and the year is 2022', () => {
    let getFullYear;

    beforeEach(() => {
      getFullYear = Date.prototype.getFullYear;
      Date.prototype.getFullYear = () => { return 2022; };
    });

    it('the expiration year of "ZCN19" should parse to 2019', () => {
      expect(SymbolParser.parseInstrumentType('ZCN19').year).toEqual(2019);
    });

    it('the expiration year of "ZCN21" should parse to 2021', () => {
      expect(SymbolParser.parseInstrumentType('ZCN21').year).toEqual(2021);
    });

    it('the expiration year of "ZCN22" should parse to 2022', () => {
      expect(SymbolParser.parseInstrumentType('ZCN22').year).toEqual(2022);
    });

    it('the expiration year of "ZCN32" should parse to 2032', () => {
      expect(SymbolParser.parseInstrumentType('ZCN32').year).toEqual(2032);
    });

    it('the expiration year of "ZCN42" should parse to 2042', () => {
      expect(SymbolParser.parseInstrumentType('ZCN42').year).toEqual(2042);
    });

    it('the expiration year of "ZCN47" should parse to 2047', () => {
      expect(SymbolParser.parseInstrumentType('ZCN47').year).toEqual(2047);
    });

    it('the expiration year of "ZCN48" should parse to 1948', () => {
      expect(SymbolParser.parseInstrumentType('ZCN48').year).toEqual(1948);
    });

    it('the expiration year of "ZCN49" should parse to 1949', () => {
      expect(SymbolParser.parseInstrumentType('ZCN49').year).toEqual(1949);
    });

    it('the expiration year of "ZCN99" should parse to 1999', () => {
      expect(SymbolParser.parseInstrumentType('ZCM99').year).toEqual(1999);
    });

    afterEach(() => {
      Date.prototype.getFullYear = getFullYear;
    });
  });
});

describe('When parsing a symbol for a futures option', () => {
  describe('and the year is 2022', () => {
    let getFullYear;

    beforeEach(() => {
      getFullYear = Date.prototype.getFullYear;
      Date.prototype.getFullYear = () => { return 2022; };
    });

    it('the expiration year of "ZWK18465C" should parse to 2018', () => {
      expect(SymbolParser.parseInstrumentType('ZWK18465C').year).toEqual(2018);
    });

    it('the expiration year of "ZWK22465C" should parse to 2022', () => {
      expect(SymbolParser.parseInstrumentType('ZWK22465C').year).toEqual(2022);
    });

    it('the expiration year of "ZWK47465C" should parse to 2047', () => {
      expect(SymbolParser.parseInstrumentType('ZWK47465C').year).toEqual(2047);
    });

    it('the expiration year of "ZWK48465C" should parse to 1948', () => {
      expect(SymbolParser.parseInstrumentType('ZWK48465C').year).toEqual(1948);
    });

    afterEach(() => {
      Date.prototype.getFullYear = getFullYear;
    });
  });
});

describe('When checking to see if a symbol is a future', () => {
  it('the symbol "ES*1" should return true', () => {
    expect(SymbolParser.getIsFuture('ES*1')).toEqual(true);
  });

  it('the symbol "ESZ6" should return true', () => {
    expect(SymbolParser.getIsFuture('ESZ6')).toEqual(true);
  });

  it('the symbol "ESZ16" should return true', () => {
    expect(SymbolParser.getIsFuture('ESZ16')).toEqual(true);
  });

  it('the symbol "ESZ2016" should return true', () => {
    expect(SymbolParser.getIsFuture('ESZ2016')).toEqual(true);
  });

  it('the symbol "ESY00" should return true', () => {
    expect(SymbolParser.getIsFuture('ESY00')).toEqual(true);
  });

  it('the symbol "ESZ016" should return false', () => {
    expect(SymbolParser.getIsFuture('ESZ016')).toEqual(false);
  });

  it('the symbol "O!H7" should return true', () => {
    expect(SymbolParser.getIsFuture('O!H7')).toEqual(true);
  });

  it('the symbol "O!H2017" should return true', () => {
    expect(SymbolParser.getIsFuture('O!H2017')).toEqual(true);
  });

  it('the symbol "IBM" should return false', () => {
    expect(SymbolParser.getIsFuture('IBM')).toEqual(false);
  });

  it('the symbol "^EURUSD" should return false', () => {
    expect(SymbolParser.getIsFuture('^EURUSD')).toEqual(false);
  });

  it('the symbol "^BTCUSDT" should return false', () => {
    expect(SymbolParser.getIsFuture('^BTCUSDT')).toEqual(false);
  });

  it('the symbol "-001A" should return false', () => {
    expect(SymbolParser.getIsFuture('-001A')).toEqual(false);
  });

  it('the symbol "$DOWI" should return false', () => {
    expect(SymbolParser.getIsFuture('$DOWI')).toEqual(false);
  });

  it('the symbol "$SG1E" should return false', () => {
    expect(SymbolParser.getIsFuture('$SG1E')).toEqual(false);
  });

  it('the symbol "_S_SP_ZCH7_ZCK7" should return false', () => {
    expect(SymbolParser.getIsFuture('_S_SP_ZCH7_ZCK7')).toEqual(false);
  });

  it('the symbol "ESZ2660Q" should return false', () => {
    expect(SymbolParser.getIsFuture('ESZ2660Q')).toEqual(false);
  });

  it('the symbol "ZWH9|470C" should return false', () => {
    expect(SymbolParser.getIsFuture('ZWH9|470C')).toEqual(false);
  });

  it('the symbol "BB1F8|12050C" should return false', () => {
    expect(SymbolParser.getIsFuture('BB1F8|12050C')).toEqual(false);
  });

  it('the symbol "ZWK18465C" should return false', () => {
    expect(SymbolParser.getIsFuture('ZWK18465C')).toEqual(false);
  });

  it('the symbol "PLATTS:AAVSV00C" should return false', () => {
    expect(SymbolParser.getIsFuture('PLATTS:AAVSV00C')).toEqual(false);
  });

  it('the symbol "PLATTS:AAVSV00" should return false', () => {
    expect(SymbolParser.getIsFuture('PLATTS:AAVSV00')).toEqual(false);
  });

  it('the symbol "AAVSV00.PT" should return false', () => {
    expect(SymbolParser.getIsFuture('AAVSV00.PT')).toEqual(false);
  });

  it('the symbol "ZCPAUS.CM" should return false', () => {
    expect(SymbolParser.getIsFuture('ZCPAUS.CM')).toEqual(false);
  });

  it('the symbol "SCB001.CP" should return false', () => {
    expect(SymbolParser.getIsFuture('SCB001.CP')).toEqual(false);
  });

  it('the symbol "AE030UBX.CS" should return false', () => {
    expect(SymbolParser.getIsFuture('AE030UBX.CS')).toEqual(false);
  });

  it('the symbol "AAPL|20200515|250.00P" should return false', () => {
    expect(SymbolParser.getIsFuture('AAPL|20200515|250.00P')).toEqual(false);
  });

  it('the symbol "AAPL1|20200515|250.00P" should return false', () => {
    expect(SymbolParser.getIsFuture('AAPL1|20200515|250.00P')).toEqual(false);
  });

  it('the symbol "HBM.TO|20220121|1.00C" should return false', () => {
    expect(SymbolParser.getIsFuture('HBM.TO|20220121|1.00C')).toEqual(false);
  });

  it('the symbol "HBM2.TO|20220121|1.00C" should return false', () => {
    expect(SymbolParser.getIsFuture('HBM2.TO|20220121|1.00C')).toEqual(false);
  });

  it('the symbol "BRK.B|20210205|170.00C" should return false', () => {
    expect(SymbolParser.getIsFuture('BRK.B|20210205|170.00C')).toEqual(false);
  });

  it('the symbol "BRK.B2|20210205|170.00C" should return false', () => {
    expect(SymbolParser.getIsFuture('BRK.B2|20210205|170.00C')).toEqual(false);
  });

  it('the symbol "$VIX|20200422|20.00WP" should return false', () => {
    expect(SymbolParser.getIsFuture('$VIX|20200422|20.00WP')).toEqual(false);
  });

  it('the symbol "AL79MRM1.C3" should return false', () => {
    expect(SymbolParser.getIsFuture('AL79MRM1.C3')).toEqual(false);
  });

  it('the symbol "C3:AL79MRM1" should return false', () => {
    expect(SymbolParser.getIsFuture('C3:AL79MRM1')).toEqual(false);
  });

  it('the symbol "VIC400.CF" should return false', () => {
    expect(SymbolParser.getIsFuture('VIC400.CF')).toEqual(false);
  });
});

describe('When checking to see if a symbol is a "concrete" future', () => {
  it('the symbol "ESZ6" should return true', () => {
    expect(SymbolParser.getIsConcrete('ESZ6')).toEqual(true);
  });

  it('the symbol "ESZ16" should return true', () => {
    expect(SymbolParser.getIsConcrete('ESZ16')).toEqual(true);
  });

  it('the symbol "ESZ2016" should return true', () => {
    expect(SymbolParser.getIsConcrete('ESZ2016')).toEqual(true);
  });

  it('the symbol "ES*0" should return false', () => {
    expect(SymbolParser.getIsConcrete('ES*0')).toEqual(false);
  });

  it('the symbol "ES*1" should return false', () => {
    expect(SymbolParser.getIsConcrete('ES*1')).toEqual(false);
  });

  it('the symbol "NG*13" should return false', () => {
    expect(SymbolParser.getIsConcrete('NG*13')).toEqual(false);
  });
});

describe('When checking to see if a symbol is a "reference" future', () => {
  it('the symbol "ESZ6" should return false', () => {
    expect(SymbolParser.getIsReference('ESZ6')).toEqual(false);
  });

  it('the symbol "ESZ16" should return false', () => {
    expect(SymbolParser.getIsReference('ESZ16')).toEqual(false);
  });

  it('the symbol "ESZ2016" should return false', () => {
    expect(SymbolParser.getIsReference('ESZ2016')).toEqual(false);
  });

  it('the symbol "ES*0" should return true', () => {
    expect(SymbolParser.getIsReference('ES*0')).toEqual(true);
  });

  it('the symbol "ES*1" should return true', () => {
    expect(SymbolParser.getIsReference('ES*1')).toEqual(true);
  });

  it('the symbol "NG*13" should return true', () => {
    expect(SymbolParser.getIsReference('NG*13')).toEqual(true);
  });
});

describe('When checking to see if a symbol is a "cash" future', () => {
  it('the symbol "ESY00" should return true', () => {
    expect(SymbolParser.getIsCashFuture('ESY00')).toEqual(true);
  });

  it('the symbol "ESZ6" should return false', () => {
    expect(SymbolParser.getIsCashFuture('ESZ6')).toEqual(false);
  });
});
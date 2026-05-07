const assert = require('@barchart/common-js/lang/assert'),
  Decimal = require('@barchart/common-js/lang/Decimal'),
  is = require('@barchart/common-js/lang/is');

const Enum = require('@barchart/common-js/lang/Enum');

module.exports = (() => {
  'use strict';

  /**
   * An enumeration that describes different conventions for formatting prices.
   */
  class UnitCode extends Enum {
    constructor(code, baseCode, decimalDigits, supportsFractions, fractionFactor, fractionDigits, fractionFactorSpecial, fractionDigitsSpecial) {
      super(code, code);

      this._baseCode = baseCode;
      this._decimalDigits = decimalDigits;
      this._supportsFractions = supportsFractions;

      if (supportsFractions) {
        this._fractionFactor = fractionFactor;
        this._fractionDigits = fractionDigits;

        this._fractionFactorSpecial = fractionFactorSpecial || fractionFactor;
        this._fractionDigitsSpecial = fractionDigitsSpecial || fractionDigits;
      } else {
        this._fractionFactor = undefined;
        this._fractionDigits = undefined;

        this._fractionFactorSpecial = undefined;
        this._fractionDigitsSpecial = undefined;
      }
    }

    get baseCode() {
      return this._baseCode;
    }

    get unitCode() {
      return this._code;
    }

    get decimalDigits() {
      return this._decimalDigits;
    }

    get supportsFractions() {
      return this._supportsFractions;
    }

    get fractionFactor() {
      return this._fractionFactor;
    }

    get fractionDigits() {
      return this._fractionDigits;
    }

    get fractionFactorSpecial() {
      return this._fractionFactorSpecial;
    }

    get fractionDigitsSpecial() {
      return this._fractionDigitsSpecial;
    }

    getFractionFactor(special) {
      return special === true ? this._fractionFactorSpecial : this._fractionFactor;
    }

    getFractionDigits(special) {
      return special === true ? this._fractionDigitsSpecial : this._fractionDigits;
    }

    getMinimumTick(tickIncrement) {
      assert.argumentIsValid(tickIncrement, 'tickIncrement', is.integer, 'must be an integer');

      const one = new Decimal(1);
      const ten = new Decimal(10);

      let discretePrice;

      if (this.supportsFractions) {
        discretePrice = one.divide(this._fractionFactor);
      } else {
        discretePrice = one.divide(ten.raise(this._decimalDigits));
      }

      const minimumTick = discretePrice.multiply(tickIncrement);

      return minimumTick.toFloat();
    }

    getMinimumTickValue(tickIncrement, pointValue) {
      assert.argumentIsValid(tickIncrement, 'tickIncrement', is.integer, 'must be an integer');
      assert.argumentIsValid(pointValue, 'pointValue', is.number, 'must be a number');

      const minimumTick = new Decimal(this.getMinimumTick(tickIncrement));
      const minimumTickValue = minimumTick.multiply(pointValue);

      return minimumTickValue.toFloat();
    }

    roundToNearestTick(value, minimumTick, roundToZero) {
      assert.argumentIsValid(value, 'value', x => is.number(x) || x instanceof Decimal, 'must be a number primitive or a Decimal instance');
      assert.argumentIsValid(minimumTick, 'minimumTick', x => is.number(x) || x instanceof Decimal, 'must be a number primitive or a Decimal instance');
      assert.argumentIsOptional(roundToZero, 'roundToZero', Boolean);

      let valueToUse = (value instanceof Decimal) ? value : new Decimal(value);
      let ticks = valueToUse.divide(minimumTick);
      let remainder = valueToUse.mod(minimumTick);

      if (!remainder.getIsZero()) {
        ticks = ticks.round(0, is.boolean(roundToZero) && roundToZero ? Decimal.ROUNDING_MODE.DOWN : Decimal.ROUNDING_MODE.NORMAL);
      }

      return ticks.multiply(minimumTick).toFloat();
    }

    toString() {
      return `[UnitCode (code=${this.code})]`;
    }

    static parse(code) {
      return Enum.fromCode(UnitCode, code);
    }

    static fromBaseCode(code) {
      return Enum.getItems(UnitCode).find(x => x.baseCode === code) || null;
    }
  }

  // FIXED: Removed "const X =" assignments as the variables were unused.
  // The Enum base class handles the registration of these instances.
  new UnitCode('2', -1, 3, true, 8, 1);
  new UnitCode('3', -2, 4, true, 16, 2);
  new UnitCode('4', -3, 5, true, 32, 2);
  new UnitCode('5', -4, 6, true, 64, 2, 320, 3);
  new UnitCode('6', -5, 7, true, 128, 3, 320, 3);
  new UnitCode('7', -6, 8, true, 256, 3, 320, 3);

  new UnitCode('8', 0, 0, false);
  new UnitCode('9', 1, 1, false);

  new UnitCode('A', 2, 2, false);
  new UnitCode('B', 3, 3, false);
  new UnitCode('C', 4, 4, false);
  new UnitCode('D', 5, 5, false);
  new UnitCode('E', 6, 6, false);
  new UnitCode('F', 7, 7, false);

  return UnitCode;
})();
'use strict';

const CumulativeVolume = require('../../../lib/marketState/CumulativeVolume');

describe('When a cumulative volume container is created with a tick increment of 0.25', () => {
  let cv;
  let symbol;
  let tickIncrement;

  beforeEach(() => {
    symbol = 'ESZ6';
    tickIncrement = 0.25;
    cv = new CumulativeVolume(symbol, tickIncrement);
  });

  it('the symbol should be the same value as assigned during construction', () => {
    expect(cv.symbol).toEqual(symbol);
  });

  it('the price level array should contain zero items', () => {
    expect(cv.toArray().length).toEqual(0);
  });

  describe('and 50 contracts are traded at 2172.50', () => {
    beforeEach(() => {
      cv.incrementVolume(2172.5, 50);
    });

    it('should report zero contracts traded at 2172.25', () => {
      expect(cv.getVolume(2172.25)).toEqual(0);
    });

    it('should report 50 contracts traded at 2172.50', () => {
      expect(cv.getVolume(2172.5)).toEqual(50);
    });

    it('should report zero contracts traded at 2172.75', () => {
      expect(cv.getVolume(2172.75)).toEqual(0);
    });

    describe('and the price level array is retrieved', () => {
      let priceLevels;

      beforeEach(() => {
        priceLevels = cv.toArray();
      });

      it('the price level array should contain one item', () => {
        expect(priceLevels.length).toEqual(1);
      });

      it('the first price level item should be for 50 contracts', () => {
        expect(priceLevels[0].volume).toEqual(50);
      });

      it('the first price level item should be priced at 2172.50', () => {
        expect(priceLevels[0].price).toEqual(2172.5);
      });
    });

    describe('and another 50 contracts are traded at 2172.50', () => {
      beforeEach(() => {
        cv.incrementVolume(2172.5, 50);
      });

      it('should report 100 contracts traded at 2172.50', () => {
        expect(cv.getVolume(2172.5)).toEqual(100);
      });
    });
  });

  describe('and an observer is added to the container', () => {
    let spyOne;

    beforeEach(() => {
      spyOne = jasmine.createSpy('spyOne');
      cv.on('events', spyOne);
    });

    describe('and 50 contracts are traded at 2172.50', () => {
      beforeEach(() => {
        cv.incrementVolume(2172.5, 50);
      });

      it('the observer should be called once', () => {
        expect(spyOne).toHaveBeenCalledTimes(1);
      });

      it('should send correct event payload', () => {
        const args = spyOne.calls.mostRecent().args[0];

        expect(args.container).toBe(cv);
        expect(args.event).toEqual('update');
        expect(args.price).toEqual(2172.5);
        expect(args.volume).toEqual(50);
      });
    });
  });
});
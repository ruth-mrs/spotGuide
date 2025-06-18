describe('Basic Validation', () => {
  
  describe('String validation', () => {
    it('should validate strings correctly', () => {
      const isValid = (str) => {
        if (!str) return false;
        if (typeof str !== 'string') return false;
        return str.trim().length > 0;
      };
      
      expect(isValid('hello')).toBe(true);
      expect(isValid('')).toBe(false);
      expect(isValid(null)).toBe(false);
      expect(isValid(undefined)).toBe(false);
    });

    it('should validate string lengths', () => {
      const isValidLength = (str, max) => {
        if (!str) return false;
        return str.length <= max;
      };
      
      expect(isValidLength('hello', 10)).toBe(true);
      expect(isValidLength('very long string here', 10)).toBe(false);
      expect(isValidLength('', 10)).toBe(false);
    });
  });

  describe('Number validation', () => {
    it('should validate numbers', () => {
      const isNumber = (val) => typeof val === 'number' && !isNaN(val);
      
      expect(isNumber(42)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber('42')).toBe(false);
      expect(isNumber(NaN)).toBe(false);
    });

    it('should validate ranges', () => {
      const inRange = (val, min, max) => val >= min && val <= max;
      
      expect(inRange(5, 1, 10)).toBe(true);
      expect(inRange(15, 1, 10)).toBe(false);
      expect(inRange(-5, 1, 10)).toBe(false);
    });
  });

  describe('Array validation', () => {
    it('should validate arrays', () => {
      const isValidArray = (arr) => Array.isArray(arr);
      
      expect(isValidArray([])).toBe(true);
      expect(isValidArray([1, 2, 3])).toBe(true);
      expect(isValidArray('not array')).toBe(false);
      expect(isValidArray(null)).toBe(false);
    });
  });

  describe('Object validation', () => {
    it('should validate objects', () => {
      const isObject = (obj) => obj !== null && typeof obj === 'object' && !Array.isArray(obj);
      
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
    });
  });
});
import * as codec from '../codec';

describe('codec', () => {
  describe('encode', () => {
    it('should return equivalent object (shallow)', () => {
      const testCodec = codec.createCodec<{ foo: string }>()(
        codec.obj({
          foo: codec.str(),
        }),
      );

      expect(
        testCodec.encode({
          foo: 'test',
        }),
      ).toEqual({ foo: 'test' });
    });

    it('should return equivalent object (deep)', () => {
      const testCodec = codec.createCodec<{
        foo: string;
        bar: {
          xyz: number;
        };
      }>()(
        codec.obj({
          foo: codec.str(),
          bar: codec.obj({
            xyz: codec.num(),
          }),
        }),
      );

      expect(
        testCodec.encode({
          foo: 'test',
          bar: {
            xyz: 42,
          },
        }),
      ).toEqual({
        foo: 'test',
        bar: {
          xyz: 42,
        },
      });
    });

    it('should remove redundant properties', () => {
      const testCodec = codec.createCodec<{ foo: string }>()(
        codec.obj({
          foo: codec.str(),
        }),
      );

      expect(
        testCodec.encode({
          foo: 'test',
          // @ts-expect-error this prop is not specified by the codec
          bar: 42,
        }),
      ).toEqual({ foo: 'test' });
    });
  });

  describe('decode', () => {
    it('should remove redundant properties', () => {
      const testCodec = codec.createCodec<{ foo: string }>()(
        codec.obj({
          foo: codec.str(),
        }),
      );

      const value = {
        foo: 'test',
        bar: 42,
      };

      expect(testCodec.decode(value)).toEqual({ foo: 'test' });
    });

    it('should throw when decoding non-string using string codec', () => {
      const testCodec = codec.createCodec<string>()(codec.str());

      expect(() => {
        testCodec.decode(42);
      }).toThrowErrorMatchingInlineSnapshot(`"Expected a string"`);
    });

    it('should throw when decoding non-number using number codec', () => {
      const testCodec = codec.createCodec<number>()(codec.num());

      expect(() => {
        testCodec.decode('');
      }).toThrowErrorMatchingInlineSnapshot(`"Expected a number"`);
    });

    it('should throw when decoding mismatched property using object codec', () => {
      const testCodec = codec.createCodec<{ foo: string }>()(
        codec.obj({
          foo: codec.str(),
        }),
      );

      expect(() => {
        testCodec.decode({
          foo: 42,
        });
      }).toThrowErrorMatchingInlineSnapshot(`"Expected a string"`);
    });

    it('should throw when decoding non-number using object codec', () => {
      const testCodec = codec.createCodec<{ bar: number }>()(
        codec.obj({
          bar: codec.num(),
        }),
      );

      expect(() => {
        testCodec.decode('');
      }).toThrowErrorMatchingInlineSnapshot(`"Input value is not an object."`);
    });

    it('should throw when decoding null using object codec', () => {
      const testCodec = codec.createCodec<{ bar: number }>()(
        codec.obj({
          bar: codec.num(),
        }),
      );

      expect(() => {
        testCodec.decode(null);
      }).toThrowErrorMatchingInlineSnapshot(`"Input value is \`null\`."`);
    });
  });
});

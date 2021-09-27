import { EmbedMode, EmbedPanel } from '../types';
import * as utils from '../utils';

describe('utils', () => {
  describe('makeEmbedUrl', () => {
    it('makes a valid url with booleans turned to numbers', () => {
      expect(
        utils.makeEmbedUrl('source_id', 'https://stately.ai', {
          mode: EmbedMode.Panels,
          panel: EmbedPanel.Events,
          readOnly: false,
          pan: false,
          zoom: true,
          showOriginalLink: false,
          controls: true,
        }),
      ).toBe(
        'https://stately.ai/viz/embed/source_id?mode=panels&panel=events&readOnly=0&pan=0&zoom=1&showOriginalLink=0&controls=1',
      );
    });
  });
  describe('parseEmbedQuery', () => {
    it.todo('with no query passed, should return the default properties');
    it.todo('parses the correct mode value');
    it.todo('parses the correct panel value');
    it.todo('parses the correct pan value');
    it.todo('parses the correct zoom value');
    it.todo('parses the correct controls value');
    it.todo('parses the correct showOriginalLink value');
    it.todo('parses the correct readOnly value');
    it.todo(
      'parses the first value when query parameter is passed more the one time',
    );
  });
  describe('calculatePanelIndexByPanelName', () => {
    it.todo('calculates the correct panel index by name');
  });
  describe('withoutEmbedQueryParams', () => {
    [
      'mode',
      'panel',
      'pan',
      'zoom',
      'controls',
      'showOriginalLink',
      'readOnly',
    ].forEach((q) => {
      it.todo(`removes ${q} from the url`);
    });
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FileFilterCallback } from 'multer';
import {
  checkImageFile,
  detectImageFormat,
  getSafeImageFilename,
} from '../../../server/utils/upload.ts';

const JPG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
const PNG_BUFFER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const WEBP_BUFFER = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.from([0x56, 0x50, 0x38, 0x20]),
]);

describe('upload utils', () => {
  it('detects supported image signatures from content', () => {
    assert.equal(detectImageFormat(JPG_BUFFER), 'jpg');
    assert.equal(detectImageFormat(PNG_BUFFER), 'png');
    assert.equal(detectImageFormat(WEBP_BUFFER), 'webp');
    assert.equal(detectImageFormat(Buffer.from('not-an-image')), null);
  });

  it('normalizes safe filenames with trusted extensions', () => {
    assert.equal(getSafeImageFilename('My Hero Banner!!.jpeg', 'jpg'), 'My-Hero-Banner.jpg');
    assert.equal(getSafeImageFilename('invoice.html', 'png'), 'invoice.png');
    assert.equal(getSafeImageFilename('   ', 'webp'), 'upload.webp');
  });

  it('accepts only matching image extension and mime combinations', () => {
    let callbackError: Error | null = null;
    let callbackAccepted: boolean | undefined;

    checkImageFile(
      {
        originalname: 'cover.jpeg',
        mimetype: 'image/jpeg',
      } as any,
      ((error: Error | null, accepted?: boolean) => {
        callbackError = error;
        callbackAccepted = accepted;
      }) as FileFilterCallback,
    );

    assert.equal(callbackError, null);
    assert.equal(callbackAccepted, true);
  });

  it('rejects uploads that spoof a mismatched extension or mime type', () => {
    let callbackError: Error | null = null;

    checkImageFile(
      {
        originalname: 'payload.html',
        mimetype: 'text/html',
      } as any,
      ((error: Error | null) => {
        callbackError = error;
      }) as FileFilterCallback,
    );

    assert.match(callbackError?.message || '', /Images only!/);
  });
});

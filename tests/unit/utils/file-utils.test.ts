import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  getFileExtension,
  getMimeType,
  getLanguage,
  isAllowedExtension,
  isDangerousExtension,
  validateFileName,
  validateFileKey,
  validateFileSize,
  getContentSize,
  encodeToBase64,
  formatFileSize,
} from '../../../src/utils/file-utils.js';
import { ValidationError } from '../../../src/errors.js';

describe('File Utilities', () => {
  describe('getFileExtension', () => {
    it('extracts extension from filename', () => {
      assert.equal(getFileExtension('test.ts'), '.ts');
      assert.equal(getFileExtension('file.spec.js'), '.js');
      assert.equal(getFileExtension('data.json'), '.json');
    });

    it('returns empty string for no extension', () => {
      assert.equal(getFileExtension('README'), '');
      assert.equal(getFileExtension('Makefile'), '');
    });

    it('handles edge cases', () => {
      assert.equal(getFileExtension('.gitignore'), '.gitignore');
      assert.equal(getFileExtension('file.'), '');
    });
  });

  describe('getMimeType', () => {
    it('returns correct mime types', () => {
      assert.equal(getMimeType('app.ts'), 'text/typescript');
      assert.equal(getMimeType('index.js'), 'application/javascript');
      assert.equal(getMimeType('config.json'), 'application/json');
      assert.equal(getMimeType('style.css'), 'text/css');
      assert.equal(getMimeType('script.py'), 'text/x-python');
    });

    it('returns octet-stream for unknown types', () => {
      assert.equal(getMimeType('file.xyz'), 'application/octet-stream');
      assert.equal(getMimeType('binary'), 'application/octet-stream');
    });
  });

  describe('getLanguage', () => {
    it('returns correct languages', () => {
      assert.equal(getLanguage('app.ts'), 'typescript');
      assert.equal(getLanguage('app.tsx'), 'typescript');
      assert.equal(getLanguage('index.js'), 'javascript');
      assert.equal(getLanguage('main.py'), 'python');
      assert.equal(getLanguage('query.sql'), 'sql');
    });

    it('returns plaintext for unknown', () => {
      assert.equal(getLanguage('file.xyz'), 'plaintext');
    });
  });

  describe('isAllowedExtension', () => {
    it('allows code file extensions', () => {
      assert.equal(isAllowedExtension('app.ts'), true);
      assert.equal(isAllowedExtension('index.js'), true);
      assert.equal(isAllowedExtension('config.json'), true);
      assert.equal(isAllowedExtension('README.md'), true);
    });

    it('rejects non-allowed extensions', () => {
      assert.equal(isAllowedExtension('image.png'), false);
      assert.equal(isAllowedExtension('doc.pdf'), false);
    });
  });

  describe('isDangerousExtension', () => {
    it('detects dangerous extensions', () => {
      assert.equal(isDangerousExtension('virus.exe'), true);
      assert.equal(isDangerousExtension('script.bat'), true);
      assert.equal(isDangerousExtension('hack.sh'), true);
      assert.equal(isDangerousExtension('lib.dll'), true);
    });

    it('allows safe extensions', () => {
      assert.equal(isDangerousExtension('app.ts'), false);
      assert.equal(isDangerousExtension('data.json'), false);
    });
  });

  describe('validateFileName', () => {
    it('validates correct filenames', () => {
      assert.equal(validateFileName('app.ts'), 'app.ts');
      assert.equal(validateFileName('my-file.js'), 'my-file.js');
      assert.equal(validateFileName('config_v2.json'), 'config_v2.json');
    });

    it('trims whitespace', () => {
      assert.equal(validateFileName('  app.ts  '), 'app.ts');
    });

    it('rejects empty filename', () => {
      assert.throws(() => validateFileName(''), ValidationError);
      assert.throws(() => validateFileName('   '), ValidationError);
    });

    it('rejects path traversal', () => {
      assert.throws(() => validateFileName('../secret.ts'), ValidationError);
      assert.throws(() => validateFileName('path/to/file.ts'), ValidationError);
    });

    it('rejects dangerous extensions', () => {
      assert.throws(() => validateFileName('malware.exe'), ValidationError);
    });

    it('rejects invalid characters', () => {
      assert.throws(() => validateFileName('file<name>.ts'), ValidationError);
    });
  });

  describe('validateFileKey', () => {
    it('validates correct keys', () => {
      assert.equal(validateFileKey('user/files/app.ts'), 'user/files/app.ts');
      assert.equal(validateFileKey('code-123'), 'code-123');
    });

    it('rejects path traversal', () => {
      assert.throws(() => validateFileKey('../etc/passwd'), ValidationError);
      assert.throws(() => validateFileKey('files/../secret'), ValidationError);
    });

    it('rejects empty key', () => {
      assert.throws(() => validateFileKey(''), ValidationError);
    });
  });

  describe('validateFileSize', () => {
    it('accepts valid sizes', () => {
      assert.doesNotThrow(() => validateFileSize(1024, 10240));
      assert.doesNotThrow(() => validateFileSize(5000, 10000));
    });

    it('rejects zero size', () => {
      assert.throws(() => validateFileSize(0, 10240), ValidationError);
    });

    it('rejects oversized files', () => {
      assert.throws(() => validateFileSize(20000, 10000), ValidationError);
    });
  });

  describe('getContentSize', () => {
    it('calculates string size', () => {
      assert.equal(getContentSize('hello'), 5);
      assert.equal(getContentSize('你好'), 6); // UTF-8 encoding
    });

    it('calculates buffer size', () => {
      assert.equal(getContentSize(Buffer.from('test')), 4);
      assert.equal(getContentSize(new Uint8Array([1, 2, 3])), 3);
    });
  });

  describe('encodeToBase64', () => {
    it('encodes strings', () => {
      assert.equal(encodeToBase64('hello'), 'aGVsbG8=');
    });

    it('encodes buffers', () => {
      assert.equal(encodeToBase64(Buffer.from('test')), 'dGVzdA==');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      assert.equal(formatFileSize(500), '500 B');
    });

    it('formats kilobytes', () => {
      assert.equal(formatFileSize(2048), '2.0 KB');
    });

    it('formats megabytes', () => {
      assert.equal(formatFileSize(5 * 1024 * 1024), '5.0 MB');
    });
  });
});

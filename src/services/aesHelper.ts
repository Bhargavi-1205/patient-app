import { AES_CONFIG } from '../config/constants';
import * as forge from 'node-forge';

const getBuffer = () => {
    const bufferModule = require('buffer');
    return bufferModule.Buffer;
};

const decodeBase64ToBytes = (input: string): Uint8Array => {
    const Buffer = getBuffer();
    return Uint8Array.from(Buffer.from(input, 'base64'));
};

/** Convert Uint8Array to binary string in chunks to avoid stack overflow on large data */
const bytesToBinaryString = (bytes: Uint8Array): string => {
    const CHUNK = 8192;
    const parts: string[] = [];
    for (let i = 0; i < bytes.length; i += CHUNK) {
        const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
        parts.push(String.fromCharCode.apply(null, Array.from(slice)));
    }
    return parts.join('');
};

const normalizeBase64 = (input: string): string => {
    const normalized = input
        .trim()
        .replace(/\s+/g, '')
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const padLength = (4 - (normalized.length % 4)) % 4;
    return normalized + '='.repeat(padLength);
};

class AESHelper {
    static lastDecryptCBCError: string | null = null;
    static lastDecryptPdfError: string | null = null;

    static async decryptCBC(base64Text: string): Promise<string | null> {
        try {
            AESHelper.lastDecryptCBCError = null;
            const CryptoJS = require('crypto-js');
            const key = CryptoJS.enc.Utf8.parse(AES_CONFIG.CBC_KEY);
            const iv = CryptoJS.enc.Utf8.parse(AES_CONFIG.CBC_IV);

            const decrypted = CryptoJS.AES.decrypt(base64Text, key, {
                iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            });

            const plainText = decrypted.toString(CryptoJS.enc.Utf8);
            return plainText || null;
        } catch (e) {
            AESHelper.lastDecryptCBCError = String((e as any)?.message || e);
            return null;
        }
    }

    /**
     * AES-GCM decryption using node-forge (pure JavaScript — works in Hermes).
     *
     * The encrypted payload is: IV (12 or 16 bytes) + ciphertext + GCM auth tag (16 bytes).
     * Some backends encode it as: IV + tag + ciphertext (reordered).
     * We try both layouts with both common IV lengths.
     */
    static async decryptPdfData(
        base64Encrypted: string,
        base64Key: string,
    ): Promise<Uint8Array | null> {
        try {
            AESHelper.lastDecryptPdfError = null;

            const normalizedEncrypted = normalizeBase64(base64Encrypted);
            const encryptedBytes = decodeBase64ToBytes(normalizedEncrypted);

            const normalizedKey = normalizeBase64(base64Key);
            const decodedKeyBytes = decodeBase64ToBytes(normalizedKey);
            // Some backends return a raw 32-char key string instead of base64.
            const rawUtf8KeyBytes = Uint8Array.from(getBuffer().from(base64Key, 'utf8'));
            const keyBytes =
                decodedKeyBytes.length === 32
                    ? decodedKeyBytes
                    : rawUtf8KeyBytes.length === 32
                        ? rawUtf8KeyBytes
                        : decodedKeyBytes;

            if (keyBytes.length !== 32) {
                throw new Error(
                    `Invalid AES key length. Expected 32 bytes, got ${keyBytes.length}.`,
                );
            }
            if (encryptedBytes.length < 13) {
                throw new Error('Invalid encrypted data payload.');
            }

            // Convert keyBytes to a binary string for forge
            const keyBinaryStr = bytesToBinaryString(keyBytes);

            const attemptErrors: string[] = [];
            const ivCandidates = [12, 16];

            for (const ivLength of ivCandidates) {
                if (encryptedBytes.length <= ivLength + 16) {
                    continue;
                }

                const ivBytes = encryptedBytes.slice(0, ivLength);
                const ivBinaryStr = bytesToBinaryString(ivBytes);
                const encryptedTail = encryptedBytes.slice(ivLength);

                // Layout 1: IV + ciphertext + tag (last 16 bytes are the GCM tag)
                const attempts: Array<{ name: string; ciphertext: Uint8Array; tag: Uint8Array }> = [];

                if (encryptedTail.length > 16) {
                    attempts.push({
                        name: `iv${ivLength}_cipher_then_tag`,
                        ciphertext: encryptedTail.slice(0, encryptedTail.length - 16),
                        tag: encryptedTail.slice(encryptedTail.length - 16),
                    });

                    // Layout 2: IV + tag (first 16 bytes) + ciphertext
                    attempts.push({
                        name: `iv${ivLength}_tag_then_cipher`,
                        ciphertext: encryptedTail.slice(16),
                        tag: encryptedTail.slice(0, 16),
                    });
                }

                for (const attempt of attempts) {
                    try {
                        const decipher = forge.cipher.createDecipher(
                            'AES-GCM',
                            forge.util.createBuffer(keyBinaryStr),
                        );

                        decipher.start({
                            iv: forge.util.createBuffer(ivBinaryStr),
                            tag: forge.util.createBuffer(
                                bytesToBinaryString(attempt.tag),
                            ),
                            tagLength: 128,
                        });

                        decipher.update(
                            forge.util.createBuffer(
                                bytesToBinaryString(attempt.ciphertext),
                            ),
                        );

                        const success = decipher.finish();
                        if (success) {
                            const outputBinaryStr = decipher.output.getBytes();
                            const result = new Uint8Array(outputBinaryStr.length);
                            for (let i = 0; i < outputBinaryStr.length; i++) {
                                result[i] = outputBinaryStr.charCodeAt(i);
                            }
                            return result;
                        } else {
                            attemptErrors.push(`${attempt.name}: authentication tag mismatch`);
                        }
                    } catch (attemptError) {
                        attemptErrors.push(
                            `${attempt.name}: ${String((attemptError as any)?.message || attemptError)}`,
                        );
                    }
                }
            }

            AESHelper.lastDecryptPdfError = `AES-GCM decrypt failed. ${attemptErrors.join(' | ')}`;
            return null;
        } catch (e) {
            AESHelper.lastDecryptPdfError = String((e as any)?.message || e);
            return null;
        }
    }
}

export default AESHelper;

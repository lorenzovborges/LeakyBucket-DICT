import type { LeakyBucketTransaction } from '../leakybucket/leakybucket.repository';

export interface PixLookupResult {
  success: boolean;
  pixKeyFound: boolean;
  ownerName: string | null;
  bankName: string | null;
  failureReason: string | null;
  message: string;
}

export class PixService {
  async queryPixKey(transaction: LeakyBucketTransaction, pixKey: string): Promise<PixLookupResult> {
    const pix = await transaction.findPixKeyByKey(pixKey);

    if (!pix) {
      return {
        success: false,
        pixKeyFound: false,
        ownerName: null,
        bankName: null,
        failureReason: 'PIX_KEY_NOT_FOUND',
        message: 'Pix key not found'
      };
    }

    if (pix.status !== 'ACTIVE') {
      return {
        success: false,
        pixKeyFound: true,
        ownerName: pix.ownerName,
        bankName: pix.bankName,
        failureReason: 'PIX_KEY_INACTIVE',
        message: 'Pix key is inactive'
      };
    }

    return {
      success: true,
      pixKeyFound: true,
      ownerName: pix.ownerName,
      bankName: pix.bankName,
      failureReason: null,
      message: 'Pix key found successfully'
    };
  }
}

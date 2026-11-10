import path from 'node:path';
import { config } from '../config';
import { JsonFile } from '../utils/jsonFile';
import type { ConsentFile, ConsentRecord } from '../types/models';

const isConsentFile = (d: unknown): d is ConsentFile =>
  !!d && typeof d === 'object' && Array.isArray((d as ConsentFile).consents);

const file = new JsonFile<ConsentFile>(
  path.join(config.paths.data, 'cookie-consent.json'),
  () => ({ consents: [] }),
  isConsentFile,
);

/** Cap the log so the demo file cannot grow without bound. */
const MAX_RECORDS = 5000;

export const consentRepository = {
  async append(record: ConsentRecord): Promise<void> {
    await file.update((data) => {
      data.consents.push(record);
      if (data.consents.length > MAX_RECORDS) {
        data.consents.splice(0, data.consents.length - MAX_RECORDS);
      }
    });
  },
};

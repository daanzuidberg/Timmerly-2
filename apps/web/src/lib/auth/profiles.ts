import 'server-only';
import { cache } from 'react';
import { eq, schema } from '@timmerly/db';
import { db } from '../db';

/** Profiel bij het account; null zolang onboarding niet gestart is. */
export const getProfessionalProfile = cache(async (userId: string) =>
  (await db().query.professionalProfiles.findFirst({ where: eq(schema.professionalProfiles.userId, userId) })) ?? null
);

export const getCompanyProfile = cache(async (userId: string) =>
  (await db().query.companyProfiles.findFirst({ where: eq(schema.companyProfiles.userId, userId) })) ?? null
);

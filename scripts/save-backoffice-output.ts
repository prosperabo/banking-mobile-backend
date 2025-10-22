import { db } from '../src/config/prisma';
import { buildLogger } from '../src/utils';

const logger = buildLogger('SaveBackofficeOutputScript');

// Payload hardcodeado basado en el output que mostraste
const rsPayload = {
  account_level: 1,
  account_status: 1,
  account_status_string: 'Active',
  address: '',
  address_document_back: '',
  address_document_back_url: '',
  address_document_front: '',
  address_document_front_url: '',
  address_document_type: 0,
  are_account_resources_of_user: false,
  business_name: '',
  business_purpose: '',
  clabe: '',
  city: '',
  colony: '',
  constitution_date: '',
  correspondence_address: '',
  country_of_birth: '',
  date_of_birth: '',
  ecommerce_id: 98,
  email: 'kabzmilz@gmail.com',
  exterior: '',
  first_name: 'Kabir',
  gender: 2,
  gender_string: 'Male',
  id: 22,
  identification_document_back: '',
  identification_document_back_url: '',
  identification_document_front: '',
  identification_document_front_url: '',
  identification_document_type: 0,
  interior: '',
  is_business: false,
  last_name: 'Qayoumi Martinez ',
  mobile: 5551234568,
  mobile_country_code: '52',
  nationality_id: 0,
  oauth_token:
    '6ebfe6a7392081e60802e91ac8ea41da71893c9664b5f459e43fe30c9eaefe96',
  occupation_id: 0,
  person_type: 1,
  private_key:
    'sk_28faede8900b880dc049a33455b681860c27f7a67bf3a5b5c8fc4409aa69a082',
  rfc: 'QAMK900131D76',
  refresh_token:
    '176fe5425e2ecfa04e376575227f3ae842aace33ed928c9045a8f0445fa11d03',
  risk_level: 0,
  second_last_name: 'Martinez',
  society_type: 0,
  selfie: '',
  selfie_url: '',
  state_id: 0,
  street: '',
  telephone: '',
  zipcode: '',
  ewallet_id: 19,
  ewallet_status: 1,
};

async function saveHardcodedBackoffice(userId: number) {
  try {
    logger.info('Saving hardcoded backoffice payload for userId: ' + userId);

    const mobileStr = rsPayload.mobile ? String(rsPayload.mobile) : undefined;

    const profileData = {
      userId,
      account_level: rsPayload.account_level,
      account_status: rsPayload.account_status,
      account_status_string: rsPayload.account_status_string,
      address: rsPayload.address || undefined,
      address_document_back: rsPayload.address_document_back || undefined,
      address_document_back_url:
        rsPayload.address_document_back_url || undefined,
      address_document_front: rsPayload.address_document_front || undefined,
      address_document_front_url:
        rsPayload.address_document_front_url || undefined,
      address_document_type: rsPayload.address_document_type || undefined,
      are_account_resources_of_user:
        rsPayload.are_account_resources_of_user || undefined,
      business_name: rsPayload.business_name || undefined,
      business_purpose: rsPayload.business_purpose || undefined,
      ciabe: (rsPayload as any).ciabe ?? (rsPayload as any).clabe ?? undefined,
      city: rsPayload.city || undefined,
      colony: rsPayload.colony || undefined,
      constitution_date: rsPayload.constitution_date || undefined,
      correspondence_address: rsPayload.correspondence_address || undefined,
      country_of_birth: rsPayload.country_of_birth || undefined,
      date_of_birth: rsPayload.date_of_birth || undefined,
      ecommerce_id: rsPayload.ecommerce_id || undefined,
      email: rsPayload.email || undefined,
      exterior: rsPayload.exterior || undefined,
      first_name: rsPayload.first_name || undefined,
      gender: rsPayload.gender || undefined,
      gender_string: rsPayload.gender_string || undefined,
      external_customer_id: rsPayload.id || undefined,
      identification_document_back:
        rsPayload.identification_document_back || undefined,
      identification_document_back_url:
        rsPayload.identification_document_back_url || undefined,
      identification_document_front:
        rsPayload.identification_document_front || undefined,
      identification_document_front_url:
        rsPayload.identification_document_front_url || undefined,
      identification_document_type:
        rsPayload.identification_document_type || undefined,
      interior: rsPayload.interior || undefined,
      is_business: rsPayload.is_business || undefined,
      last_name: rsPayload.last_name || undefined,
      mobile: mobileStr || undefined,
      mobile_country_code: rsPayload.mobile_country_code || undefined,
      nationality_id: rsPayload.nationality_id || undefined,
      oauth_token: rsPayload.oauth_token || undefined,
      occupation_id: rsPayload.occupation_id || undefined,
      person_type: rsPayload.person_type || undefined,
      private_key: rsPayload.private_key ?? undefined,
      rfc: rsPayload.rfc ?? undefined,
      refresh_token: rsPayload.refresh_token ?? undefined,
      risk_level: rsPayload.risk_level || undefined,
      second_last_name: rsPayload.second_last_name || undefined,
      society_type: rsPayload.society_type || undefined,
      selfie: rsPayload.selfie || undefined,
      selfie_url: rsPayload.selfie_url || undefined,
      state_id: rsPayload.state_id || undefined,
      street: rsPayload.street || undefined,
      telephone: rsPayload.telephone || undefined,
      zipcode: rsPayload.zipcode || undefined,
      ewallet_id: rsPayload.ewallet_id || undefined,
      ewallet_status: rsPayload.ewallet_status || undefined,
    } as any;

    const authData = {
      userId,
      clientState: 9,
      deviceId: `device_${userId}_${Date.now()}`,
      // Prisma types require string for these fields; use empty string fallback if absent
      privateKey: rsPayload.private_key ?? '',
      refreshToken: rsPayload.refresh_token ?? '',
      extraLoginData: JSON.stringify({
        email: rsPayload.email,
        mobile: mobileStr,
      }),
      lastCustomerOauthToken: rsPayload.oauth_token || undefined,
      oauthExpirationTimestamp: undefined,
      refreshExpirationTimestamp: undefined,
      externalCustomerId: rsPayload.id || undefined,
      ewalletId: rsPayload.ewallet_id || undefined,
    } as any;

    await db.$transaction([
      db.backofficeCustomerProfile.upsert({
        where: { userId },
        create: profileData,
        update: { ...profileData, updatedAt: new Date() },
      }),
      db.backofficeAuthState.upsert({
        where: { userId },
        create: authData,
        update: {
          privateKey: authData.privateKey,
          refreshToken: authData.refreshToken,
          lastCustomerOauthToken: authData.lastCustomerOauthToken,
          externalCustomerId: authData.externalCustomerId,
          ewalletId: authData.ewalletId,
          updatedAt: new Date(),
        },
      }),
    ]);

    logger.info('Saved backoffice profile and auth state successfully');
  } catch (error) {
    logger.error(
      'Error saving hardcoded backoffice payload:',
      error instanceof Error ? { message: error.message } : { error }
    );
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Cambia este userId por el usuario real al que quieras asociar estos datos
if (require.main === module) {
  saveHardcodedBackoffice(46)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { saveHardcodedBackoffice };

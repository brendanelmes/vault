import Model, { attr } from '@ember-data/model';
import lazyCapabilities, { apiPath } from 'vault/macros/lazy-capabilities';
import { withModelValidations } from 'vault/decorators/model-validations';

import fieldToAttrs from 'vault/utils/field-to-attrs';

const validations = {
  name: [{ type: 'presence', message: 'Name is required.' }],
};

@withModelValidations(validations)
export default class PkiRoleModel extends Model {
  get useOpenAPI() {
    // must be a getter so it can be accessed in path-help.js
    return true;
  }
  getHelpUrl(backend) {
    return `/v1/${backend}/roles/example?help=1`;
  }

  @attr('string', { readOnly: true }) backend;

  /* Overriding OpenApi default options */
  @attr('string', {
    label: 'Role name',
    fieldValue: 'name',
  })
  name;

  @attr('string', {
    label: 'Issuer reference',
    defaultValue: 'default',
    subText: `Specifies the issuer that will be used to create certificates with this role. To find this, run read -field=default pki_int/config/issuers in the console. By default, we will use the mounts default issuer.`,
  })
  issuerRef;

  @attr({
    label: 'Not valid after',
    subText:
      'The time after which this certificate will no longer be valid. This can be a TTL (a range of time from now) or a specific date. If no TTL is set, the system uses "default" or the value of max_ttl, whichever is shorter. Alternatively, you can set the not_after date below.',
    editType: 'yield',
  })
  customTtl;

  @attr({
    label: 'Backdate validity',
    helperTextEnabled:
      'Also called the not_before_duration property. Allows certificates to be valid for a certain time period before now. This is useful to correct clock misalignment on various systems when setting up your CA.',
    editType: 'ttl',
    hideToggle: true,
    defaultValue: '30s', // The API type is "duration" which accepts both an integer and string e.g. 30 || '30s'
  })
  notBeforeDuration;

  @attr({
    label: 'Max TTL',
    helperTextDisabled:
      'The maximum Time-To-Live of certificates generated by this role. If not set, the system max lease TTL will be used.',
    editType: 'ttl',
    defaultShown: 'System default',
  })
  maxTtl;

  @attr('boolean', {
    label: 'Generate lease with certificate',
    subText:
      'Specifies if certificates issued/signed against this role will have Vault leases attached to them.',
    editType: 'boolean',
    docLink: '/api-docs/secret/pki#create-update-role',
  })
  generateLease;

  @attr('boolean', {
    label: 'Do not store certificates in storage backend',
    subText:
      'This can improve performance when issuing large numbers of certificates. However, certificates issued in this way cannot be enumerated or revoked.',
    editType: 'boolean',
    docLink: '/api-docs/secret/pki#create-update-role',
  })
  noStore;

  @attr('boolean', {
    label: 'Basic constraints valid for non-CA',
    subText: 'Mark Basic Constraints valid when issuing non-CA certificates.',
    editType: 'boolean',
  })
  addBasicConstraints;
  /* End of overriding default options */

  /* Overriding OpenApi Domain handling options */
  @attr({
    label: 'Allowed domains',
    subText: 'Specifies the domains this role is allowed to issue certificates for. Add one item per row.',
    editType: 'stringArray',
    hideFormSection: true,
  })
  allowedDomains;

  @attr('boolean', {
    label: 'Allow templates in allowed domains',
  })
  allowedDomainsTemplate;
  /* End of overriding Domain handling options */

  /* Overriding OpenApi Key parameters options */
  @attr('string', {
    label: 'Key type',
    possibleValues: ['rsa', 'ec', 'ed25519', 'any'],
    defaultValue: 'rsa',
  })
  keyType;

  @attr('string', {
    label: 'Key bits',
    defaultValue: 2048,
  })
  keyBits; // keyBits is a conditional value based on keyType. The model param is handled in the pkiKeyParameters component.

  @attr('number', {
    label: 'Signature bits',
    subText: `Only applicable for key_type 'RSA'. Ignore for other key types.`,
    defaultValue: 0,
    possibleValues: [
      {
        value: 0,
        displayName: 'Defaults to 0',
      },
      {
        value: 256,
        displayName: '256 for SHA-2-256',
      },
      {
        value: 384,
        displayName: '384 for SHA-2-384',
      },
      {
        value: 512,
        displayName: '512 for SHA-2-5124',
      },
    ],
  })
  signatureBits;
  /* End of overriding Key parameters options */

  /* Overriding API Policy identifier option */
  @attr({
    label: 'Policy identifiers',
    subText: 'A comma-separated string or list of policy object identifiers (OIDs). Add one per row. ',
    editType: 'stringArray',
    hideFormSection: true,
  })
  policyIdentifiers;
  /* End of overriding Policy identifier options */

  /* Overriding OpenApi SAN options */
  @attr('boolean', {
    label: 'Allow IP SANs',
    subText: 'Specifies if clients can request IP Subject Alternative Names.',
    editType: 'boolean',
    defaultValue: true,
  })
  allowIpSans;

  @attr({
    label: 'URI Subject Alternative Names (URI SANs)',
    subText: 'Defines allowed URI Subject Alternative Names. Add one item per row',
    editType: 'stringArray',
    docLink: '/docs/concepts/policies',
    hideFormSection: true,
  })
  allowedUriSans;

  @attr('boolean', {
    label: 'Allow URI SANs template',
    subText: 'If true, the URI SANs above may contain templates, as with ACL Path Templating.',
    editType: 'boolean',
    docLink: '/docs/concepts/policies',
  })
  allowUriSansTemplate;

  @attr({
    label: 'Other SANs',
    subText: 'Defines allowed custom OID/UTF8-string SANs. Add one item per row.',
    editType: 'stringArray',
    hideFormSection: true,
  })
  allowedOtherSans;
  /* End of overriding SAN options */

  /* Overriding OpenApi Additional subject field options */
  @attr({
    label: 'Allowed serial numbers',
    subText:
      'A list of allowed serial numbers to be requested during certificate issuance. Shell-style globbing is supported. If empty, custom-specified serial numbers will be forbidden.',
    editType: 'stringArray',
    hideFormSection: true,
  })
  allowedSerialNumbers;

  @attr('boolean', {
    label: 'Require common name',
    subText: 'If set to false, common name will be optional when generating a certificate.',
    defaultValue: true,
  })
  requireCn;

  @attr('boolean', {
    label: 'Use CSR common name',
    subText:
      'When used with the CSR signing endpoint, the common name in the CSR will be used instead of taken from the JSON data.',
    defaultValue: true,
  })
  useCsrCommonName;

  @attr('boolean', {
    label: 'Use CSR SANs',
    subText:
      'When used with the CSR signing endpoint, the subject alternate names in the CSR will be used instead of taken from the JSON data.',
    defaultValue: true,
  })
  useCsrSans;

  @attr({
    label: 'Organization Units (OU)',
    subText:
      'A list of allowed serial numbers to be requested during certificate issuance. Shell-style globbing is supported. If empty, custom-specified serial numbers will be forbidden.',
    hideFormSection: true,
  })
  ou;

  @attr('array', {
    defaultValue() {
      return ['DigitalSignature', 'KeyAgreement', 'KeyEncipherment'];
    },
  })
  keyUsage;

  @attr('array', {
    defaultValue() {
      return [];
    },
  })
  extKeyUsage;

  @attr({ hideFormSection: true }) organization;
  @attr({ hideFormSection: true }) country;
  @attr({ hideFormSection: true }) locality;
  @attr({ hideFormSection: true }) province;
  @attr({ hideFormSection: true }) streetAddress;
  @attr({ hideFormSection: true }) postalCode;
  /* End of overriding Additional subject field options */

  /* CAPABILITIES */
  @lazyCapabilities(apiPath`${'backend'}/roles/${'id'}`, 'backend', 'id') updatePath;
  get canDelete() {
    return this.updatePath.get('canCreate');
  }
  get canEdit() {
    return this.updatePath.get('canEdit');
  }
  get canRead() {
    return this.updatePath.get('canRead');
  }

  @lazyCapabilities(apiPath`${'backend'}/issue/${'id'}`, 'backend', 'id') generatePath;
  get canReadIssue() {
    // ARG TODO was duplicate name, added Issue
    return this.generatePath.get('canUpdate');
  }
  @lazyCapabilities(apiPath`${'backend'}/sign/${'id'}`, 'backend', 'id') signPath;
  get canSign() {
    return this.signPath.get('canUpdate');
  }
  @lazyCapabilities(apiPath`${'backend'}/sign-verbatim/${'id'}`, 'backend', 'id') signVerbatimPath;
  get canSignVerbatim() {
    return this.signVerbatimPath.get('canUpdate');
  }

  _fieldToAttrsGroups = null;

  // Gets header/footer copy for specific toggle groups.
  get fieldGroupsInfo() {
    return {
      'Domain handling': {
        footer: {
          text: 'These options can interact intricately with one another. For more information,',
          docText: 'learn more here.',
          docLink: '/api-docs/secret/pki#allowed_domains',
        },
      },
      'Subject Alternative Name (SAN) Options': {
        header: {
          text: `Subject Alternative Names (SANs) are identities (domains, IP addresses, and URIs) Vault attaches to the requested certificates.`,
        },
      },
      'Additional subject fields': {
        header: {
          text: `Additional identity metadata Vault can attach to the requested certificates.`,
        },
      },
    };
  }

  get fieldGroups() {
    if (!this._fieldToAttrsGroups) {
      this._fieldToAttrsGroups = fieldToAttrs(this, [
        {
          default: [
            'name',
            'issuerRef',
            'customTtl',
            'notBeforeDuration',
            'maxTtl',
            'generateLease',
            'noStore',
            'addBasicConstraints',
          ],
        },
        {
          'Domain handling': [
            'allowedDomains',
            'allowedDomainsTemplate',
            'allowBareDomains',
            'allowSubdomains',
            'allowGlobDomains',
            'allowWildcardCertificates',
            'allowLocalhost', // default: true (returned true by OpenApi)
            'allowAnyName',
            'enforceHostnames', // default: true (returned true by OpenApi)
          ],
        },
        {
          'Key parameters': ['keyType', 'keyBits', 'signatureBits'],
        },
        {
          'Key usage': ['keyUsage', 'extKeyUsage'],
        },
        { 'Policy identifiers': ['policyIdentifiers'] },
        {
          'Subject Alternative Name (SAN) Options': [
            'allowIpSans',
            'allowedUriSans',
            'allowUriSansTemplate',
            'allowedOtherSans',
          ],
        },
        {
          'Additional subject fields': [
            'allowedSerialNumbers',
            'requireCn',
            'useCsrCommonName',
            'useCsrSans',
            'ou',
            'organization',
            'country',
            'locality',
            'province',
            'streetAddress',
            'postalCode',
          ],
        },
      ]);
    }
    return this._fieldToAttrsGroups;
  }
}

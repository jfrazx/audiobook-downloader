export interface LicensePaths {
  file_path: string;
  file_name: string;
  destination: string;
  file_contents: string;
}

export interface License {
  License: {
    SignedInfo: {
      Version: number;

      /**
       * @example '66130efe-095b-4feb-d452-533b4adf6f51-415'
       */
      ContentID: string;
      ClientID: string;
    };
    Signature: string;
    xmlns: string;

    /**
     * @example 'http://www.w3.org/2001/XMLSchema-instance'
     */
    'xmlns:i': string;
  };
}

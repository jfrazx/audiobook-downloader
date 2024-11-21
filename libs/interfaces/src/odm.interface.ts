import type { Metadata } from './metadata.interface';

export interface ODMContent {
  '?xml': {
    version: string;
  };
  OverDriveMedia: {
    License: {
      AcquisitionUrl: string;
    };
    cdata: string;
    DrmInfo: {
      PlayOnPC: number;
      PlayOnPCCount: number;
      BurnToCD: number;
      BurnToCDCount: number;
      PlayOnPM: number;
      TransferToSDMI: number;
      TransferToNonSDMI: number;
      TransferCount: number;
      CollaborativePlay: number;
      PublicPerformance: number;
      TranscodeToAAC: number;

      /**
       * @example '2024-09-03T03:49:58Z'
       */
      ExpirationDate: string;
      Hash: string;
      Hash2: string;
    };
    Formats: {
      Format: {
        Quality: {
          level: string;
        };
        Protocols: {
          Protocol: {
            method: string;
            baseurl: string;
          };
        };
        Parts: {
          Part: Part[];

          /**
           * @example '9'
           */
          count: string;
        };

        /**
         * @example 'Medium Quality'
         */
        name: string;
      };
    };
    Source: {
      /**
       * Library name
       */
      Name: string;

      /**
       * Library Overdrive website URL
       */
      WebsiteUrl: string;

      /**
       * Library Overdrive banner URL
       */
      BannerUrl: string;

      /**
       * Library Overdrive accent color
       *
       * @example '#eeeeee'
       */
      AccentColor: string;

      /**
       * Library Overdrive id. Appears to be subdomain of website url
       */
      id: string;
    };

    Metadata: Metadata;

    /**
     * @example '055-4329576-00054'
     */
    TransactionID: string;

    /**
     * Early return URL
     */
    EarlyReturnURL: string;

    /**
     * Download success URL
     */
    DownloadSuccessURL: string;

    id: string;

    /**
     * @example '3.0.0.0'
     */
    ODMVersion: string;

    /**
     * @example '3.0.0.0'
     */
    OMCVersion: string;
  };
}

export interface Part {
  /**
   * @example '1'
   */
  number: string;

  /**
   * @example '27203190'
   */
  filesize: string;

  /**
   * @example 'Part 1'
   */
  name: string;

  /**
   * @example '0887-1\\73D\\DA5\\95\\{73DA5956-AB52-413D-9213-AC8A0E62F71E}Fmt425-Part01.mp3'
   */
  filename: string;

  /**
   * @example '57:40'
   */
  duration: string;
}

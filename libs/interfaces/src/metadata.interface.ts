export interface Metadata {
  ContentType: string;
  Description: string;
  Title: string;
  SubTitle: string;
  SortTitle: string;
  Series: string;

  /**
   * @example 'GraphicAudio'
   */
  Publisher: string;
  ThumbnailUrl: string;
  CoverUrl: string;
  Creators: {
    Creator: Creator[] | Creator;
  };

  Subjects: {
    Subject: Subject[] | Subject;
  };

  Languages: {
    Language: Language[] | Language;
  };
}

export interface Creator {
  /**
   * @example 'Author'
   */
  role: string;

  /**
   * @example 'Frederic Block'
   */
  '#text': string;

  /**
   * @example 'Block, Frederic'
   */
  'file-as': string;
}

export interface Subject {
  /**
   * @example '111'
   */
  id: string;

  /**
   * @example 'Nonfiction'
   */
  '#text': string;
}

export interface Language {
  /**
   * @example 'en'
   */
  code: string;

  /**
   * @example 'English'
   */
  '#text': string;
}

export interface MP3Metadata {
  authors: string[];
  description: string;
  genres: string[];
  languages: string[];
  narrators: string[];
  published_date: string;
  publisher: string;
  series: string[];
  sort_title: string;
  subtitle: string;
  title: string;
}

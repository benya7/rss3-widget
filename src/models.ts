interface InfraConfigurations {
    element?: HTMLElement;
}

/**
 * A model representing all possible configurations
 * that can be done from embedded script. Those settings
 * are passed around in application via Context.
 */
export interface AppConfigurations {
  disableDarkMode: boolean;
  debug: boolean;
  serviceBaseUrl: string;
  accounts: string[];
  networks: string[];
  tags: string[];
  platforms: string[];
  limit: number;
  styles: {
    classNameContainer?: string;
  };
}

export type Configurations = InfraConfigurations & AppConfigurations;

export interface ProfileParams {
  network?: string[];
  platform?: string[];
}

export interface NotesParams extends ProfileParams {
  refresh?: boolean;
  cursor?: string;
  limit?: number;
  hash?: string;
  tag?: string[];
  type?: string[];
  time?: string;
  include_poap?: boolean;
  count_only?: boolean;
  query_status?: boolean;
}

export interface ListParams {
  address: string[];
}

export interface NotesResponse {
  cursor: string;
  result: Note[];
  total: number;
}

export interface WidgetApi {
  getProfileByInstance: (addressOrEns: string, params?: ProfileParams) => any;
  getNotesByInstance: (
    addressOrEns: string,
    params?: NotesParams
  ) => Promise<NotesResponse>;
  getProfileByList: (params: ListParams) => any;
  getNotesByList: (params: ListParams & NotesParams) => Promise<NotesResponse>;
}

export interface Action {
  address_from: string;
  address_to: string;
  index: number;
  metadata: Metadata;
  platform?: string;
  related_urls: string[];
  tag: string;
  type: string;
}

export interface Token {
  decimals?: number;
  image?: string;
  name?: string;
  standard?: string;
  symbol?: string;
  value?: string;
  value_display?: string;
}

export interface Swap {
  from?: Token;
  protocol?: string;
  to?: Token;
}

export interface Post {
  body?: string;
  summary?: string;
  title?: string;
}

export interface Donation {
  description?: string;
  logo?: string;
  platform?: string;
  title?: string;
  token?: Token;
}

export interface Nft {
  attributes?: Array<{ value: string, strait_type: string}>;
  collection?: string;
  contract_address?: string;
  description?: string;
  cost?: Token;
  id?: string;
  image?: string;
  name?: string;
  standard?: string;
  symbol?: string;
  value?: string;
  value_display?: string;
}

export interface Liquidity {
  action?: string;
  protocol?: string;
  tokens?: Token[];
}

export interface Vote {
  choice?: string;
  proposal?: Proposal;
  type_on_platform?: string[];
}

export interface Proposal {
  body: string;
  end_at: string;
  id: string;
  options: string[];
  organization: {id: string, name: string};
  start_at: string;
  title: string;
}

export interface Comment {
  author?: string[];
  body?: string;
  target?: Target;
  type_on_platform?: string[];
}

export interface Target {
  author: string[];
  body: string;
  media: Media[];
  target_url: string;
  summary: string;
}

export interface Media {
  address: string;
  mime_type: string;
}

export interface Metadata extends Token, Swap, Comment, Donation, Post, Nft, Vote, Liquidity {}

export interface Note {
  actions: Action[];
  address_from: string;
  address_to: string;
  fee: string;
  hash: string;
  network: string;
  owner: string;
  succes: boolean;
  tag: string;
  timestamp: string;
  type: string;
}
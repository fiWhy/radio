export interface SourceBufferOptions {
  [key: string]: any;
}

export interface PlayerOptions {
  [key: string]: any;
}

export interface Source {
  url: string;
  format: string;
  codec: string;
}

export interface MediaOptions {
  segmented?: boolean;
  totalSegments?: number;
  sourceBufferOptions?: SourceBufferOptions;
  playerOptions?: PlayerOptions;
  log?: boolean;
}

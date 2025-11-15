import { AnswerOptions } from 'jssip/lib/RTCSession';
import { CallOptions } from 'jssip/lib/UA';

export interface ISipSessionConfig {
  answerConfig: Partial<AnswerOptions>;
  outgoingConfig: Partial<CallOptions>;
}

const mediaConstraints: AnswerOptions['mediaConstraints'] = { audio: true, video: false };

export const SIP_SESSION_DEFAULT_CONFIG: ISipSessionConfig = {
  answerConfig: { mediaConstraints },
  outgoingConfig: { mediaConstraints },
};

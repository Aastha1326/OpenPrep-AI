/**
 * Remote Human Proctor Intervention Dispatch & Escalation Protocols
 */

export interface ProctorInterventionReport {
  escalationLevel: 'AUTOMATED_WARNING' | 'HUMAN_PROCTOR_TAKEOVER' | 'IMMEDIATE_DISQUALIFICATION';
  recommendedActions: string[];
}

/**
 * Calculates human proctor intervention escalation rules.
 */
export function evaluateProctorInterventionEscalation(riskScore: number): ProctorInterventionReport {
  if (riskScore >= 70) {
    return {
      escalationLevel: 'IMMEDIATE_DISQUALIFICATION',
      recommendedActions: [
        'Invalidate candidate answer responses.',
        'Issue formal NBE/CPCB malpractice disqualification notice.',
        'Archive full WebRTC audio/video recording for legal appeal audit.',
      ],
    };
  } else if (riskScore >= 40) {
    return {
      escalationLevel: 'HUMAN_PROCTOR_TAKEOVER',
      recommendedActions: [
        'Pause candidate exam timer immediately.',
        'Initiate mandatory 360-degree webcam room pan verification.',
        'Request candidate photo ID re-authentication.',
      ],
    };
  }

  return {
    escalationLevel: 'AUTOMATED_WARNING',
    recommendedActions: ['Display on-screen banner: Keep gaze focused on test window.'],
  };
}
